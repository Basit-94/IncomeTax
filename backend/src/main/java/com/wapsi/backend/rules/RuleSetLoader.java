package com.wapsi.backend.rules;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

/** Loads immutable rule data by version. The computation layer receives the result explicitly. */
@Component
public class RuleSetLoader {
    private final ObjectMapper objectMapper;

    public RuleSetLoader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public RuleSetDefinition load(String version) {
        String resourceName = "rules/" + version + ".json";
        try (InputStream input = new ClassPathResource(resourceName).getInputStream()) {
            return objectMapper.readValue(input, RuleSetDocument.class).toDefinition();
        } catch (IOException exception) {
            throw new IllegalArgumentException("Rule set is unavailable: " + version, exception);
        }
    }
}
