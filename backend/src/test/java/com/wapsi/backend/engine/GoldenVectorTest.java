package com.wapsi.backend.engine;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wapsi.backend.money.Money;
import com.wapsi.backend.rules.RuleSetDefinition;
import com.wapsi.backend.rules.RuleSetLoader;

class GoldenVectorTest {
    private static final ObjectMapper JSON = new ObjectMapper().findAndRegisterModules();
    private static final TaxEngine ENGINE = new TaxEngine();
    private static RuleSetLoader ruleSets;

    @BeforeAll
    static void setUp() {
        ruleSets = new RuleSetLoader(JSON);
    }

    @Test
    void javaMatchesTypeScriptGoldenVectors() throws IOException {
        Path fixture = Path.of("fixtures", "golden", "vectors.json");
        if (!Files.exists(fixture)) {
            fixture = Path.of("..", "fixtures", "golden", "vectors.json");
        }
        assertTrue(Files.exists(fixture), "Run the TypeScript vector exporter first: " + fixture);

        JsonNode vectors = JSON.readTree(Files.readString(fixture)).path("vectors");
        assertTrue(vectors.isArray() && !vectors.isEmpty(), "golden vector file must contain cases");
        for (JsonNode vector : vectors) {
            String id = vector.path("id").asText();
            JsonNode inputNode = vector.path("input");
            String regime = inputNode.path("regime").asText();
            RuleSetDefinition rules = ruleSets.load("2026-27-" + regime);
            TaxResult actual = ENGINE.compute(rules, input(inputNode));
            JsonNode expected = vector.path("expected");

            assertMoney(expected, actual.grossIncome().paise(), "grossIncome", id);
            assertMoney(expected, actual.standardDeduction().paise(), "standardDeduction", id);
            assertMoney(expected, actual.totalDeductions().paise(), "totalDeductions", id);
            assertMoney(expected, actual.taxableIncome().paise(), "taxableIncome", id);
            assertMoney(expected, actual.taxBeforeRebate().paise(), "taxBeforeRebate", id);
            assertMoney(expected, actual.rebate87A().paise(), "rebate87A", id);
            assertMoney(expected, actual.cess().paise(), "cess", id);
            assertMoney(expected, actual.totalTax().paise(), "totalTax", id);
            assertMoney(expected, actual.tdsCredits().paise(), "tdsCredits", id);
            assertMoney(expected, actual.refundOrDue().paise(), "refundOrDue", id);
            assertSlabs(expected.path("slabBreakdown"), actual.slabBreakdown(), id);
        }
    }

    private static TaxInput input(JsonNode node) {
        List<TaxFact> facts = new ArrayList<>();
        for (JsonNode fact : node.path("facts")) {
            facts.add(new TaxFact(fact.path("kind").asText(), Money.ofPaise(fact.path("amountPaise").asLong())));
        }
        List<TaxClaim> claims = new ArrayList<>();
        for (JsonNode claim : node.path("claims")) {
            claims.add(new TaxClaim(claim.path("section").asText(), Money.ofPaise(claim.path("amountPaise").asLong())));
        }
        String ageBand = node.path("ageBand").isNull() ? null : node.path("ageBand").asText();
        JsonNode tds = node.path("tdsCreditsPaise");
        Money tdsCredits = tds.isNull() ? Money.ofPaise(0) : Money.ofPaise(tds.asLong());
        return new TaxInput(facts, claims, ageBand, tdsCredits);
    }

    private static void assertMoney(JsonNode expected, long actual, String field, String id) {
        assertEquals(expected.path(field + "Paise").asLong(), actual, id + ": " + field);
    }

    private static void assertSlabs(JsonNode expected, List<TaxSlab> actual, String id) {
        assertEquals(expected.size(), actual.size(), id + ": slab count");
        for (int index = 0; index < actual.size(); index++) {
            JsonNode expectedSlab = expected.get(index);
            TaxSlab actualSlab = actual.get(index);
            assertEquals(expectedSlab.path("fromPaise").asLong(), actualSlab.fromPaise(), id + ": slab " + index + " from");
            JsonNode expectedTo = expectedSlab.path("toPaise");
            if (expectedTo.isNull()) {
                assertEquals(null, actualSlab.toPaise(), id + ": slab " + index + " to");
            } else {
                assertEquals(expectedTo.asLong(), actualSlab.toPaise(), id + ": slab " + index + " to");
            }
            assertTrue(new BigDecimal(expectedSlab.path("rate").asText()).compareTo(actualSlab.rate()) == 0,
                    id + ": slab " + index + " rate");
            assertEquals(expectedSlab.path("taxPaise").asLong(), actualSlab.taxPaise(), id + ": slab " + index + " tax");
        }
    }
}
