import { describe, expect, it } from "vitest";
import { PERSONAS } from "../../personas";
import {
  taxReducer,
  INITIAL_STATE,
  deriveTaxReturn,
} from "../../../context/TaxReturnContext";

describe("Card 05 - Notices & Defect Resolver", () => {
  it("stages revised return u/s 139(5) and resolves defect notice", () => {
    // 1. Initial State: defect notice is open
    const stateWithNotice = {
      ...INITIAL_STATE,
      defectNoticeOpen: true,
    };

    expect(stateWithNotice.defectNoticeOpen).toBe(true);
    expect(stateWithNotice.revisedReturnStaged).toBe(false);

    // 2. Citizen chooses 'Agree & Stage Revised Return' in Card 5
    const stateAfterStage = taxReducer(stateWithNotice, {
      type: "STAGE_REVISED_RETURN",
    });

    // 3. Verify revised return is staged u/s 139(5) and defect notice is cleared
    expect(stateAfterStage.revisedReturnStaged).toBe(true);
    expect(stateAfterStage.defectNoticeOpen).toBe(false);
    expect(stateAfterStage.filingSection).toBe("139(5)");

    // 4. Verify state after stage
    expect(stateAfterStage.revisedReturnStaged).toBe(true);
    expect(stateAfterStage.filingSection).toBe("139(5)");
  });
});
