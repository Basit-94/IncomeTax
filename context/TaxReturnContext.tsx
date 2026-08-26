"use client";

import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { computeAY2026Tax, RegimeResult } from '../lib/taxEngineAY2026';

export interface TaxFact {
  id: 'salary' | 'consulting' | 'interest' | 'other' | 'tds' | 'ded80c' | 'ded80d';
  label: string;
  category: 'income' | 'tax_paid' | 'deduction';
  reportedAmount: number; // Pre-filled from 26AS / AIS
  userAmount: number;     // Effective user number
  status: 'confirmed' | 'disputed' | 'pending';
  disputeReason?: string;
}

interface TaxReturnState {
  facts: Record<string, TaxFact>;
  pan: string;
  fullName: string;
  isSalaried: boolean;
  selectedRegime: 'NEW' | 'OLD';
}

type Action =
  | { type: 'CONFIRM_FACT'; factId: string }
  | { type: 'UPDATE_FACT'; factId: string; amount: number; reason: string }
  | { type: 'RESET_FACT'; factId: string }
  | { type: 'SET_REGIME'; regime: 'NEW' | 'OLD' }
  | {
      type: 'SYNC_STATE';
      payload: {
        fullName: string;
        pan: string;
        isSalaried: boolean;
        regime: 'NEW' | 'OLD';
        facts: Record<string, number>;
        confirmedIds: string[];
      };
    };

const INITIAL_STATE: TaxReturnState = {
  pan: 'ABCDE1234F',
  fullName: 'Taxpayer Name',
  isSalaried: true,
  selectedRegime: 'NEW',
  facts: {
    salary: { id: 'salary', label: 'Gross Salary Income', category: 'income', reportedAmount: 600000, userAmount: 600000, status: 'pending' },
    consulting: { id: 'consulting', label: 'Freelance / Consulting', category: 'income', reportedAmount: 0, userAmount: 0, status: 'pending' },
    interest: { id: 'interest', label: 'Savings & FD Interest', category: 'income', reportedAmount: 10000, userAmount: 10000, status: 'pending' },
    other: { id: 'other', label: 'Other Incomes / Dividend', category: 'income', reportedAmount: 0, userAmount: 0, status: 'pending' },
    tds: { id: 'tds', label: 'Tax Deducted at Source (TDS)', category: 'tax_paid', reportedAmount: 30000, userAmount: 30000, status: 'pending' },
    ded80c: { id: 'ded80c', label: 'Section 80C Investments', category: 'deduction', reportedAmount: 0, userAmount: 0, status: 'pending' },
    ded80d: { id: 'ded80d', label: 'Section 80D Health Insurance', category: 'deduction', reportedAmount: 0, userAmount: 0, status: 'pending' },
  },
};

function taxReducer(state: TaxReturnState, action: Action): TaxReturnState {
  switch (action.type) {
    case 'CONFIRM_FACT':
      return {
        ...state,
        facts: {
          ...state.facts,
          [action.factId]: { ...state.facts[action.factId], status: 'confirmed' },
        },
      };

    case 'UPDATE_FACT':
      return {
        ...state,
        facts: {
          ...state.facts,
          [action.factId]: {
            ...state.facts[action.factId],
            userAmount: action.amount,
            status: 'disputed',
            disputeReason: action.reason,
          },
        },
      };

    case 'RESET_FACT':
      return {
        ...state,
        facts: {
          ...state.facts,
          [action.factId]: {
            ...state.facts[action.factId],
            userAmount: state.facts[action.factId].reportedAmount,
            status: 'pending',
            disputeReason: undefined,
          },
        },
      };

    case 'SET_REGIME':
      return { ...state, selectedRegime: action.regime };

    case 'SYNC_STATE': {
      const newFacts = { ...state.facts };
      for (const [key, amount] of Object.entries(action.payload.facts)) {
        if (newFacts[key]) {
          newFacts[key] = {
            ...newFacts[key],
            userAmount: amount,
            status: action.payload.confirmedIds.includes(key) ? 'confirmed' : newFacts[key].status === 'confirmed' ? 'pending' : newFacts[key].status,
          };
        }
      }
      return {
        ...state,
        fullName: action.payload.fullName,
        pan: action.payload.pan,
        isSalaried: action.payload.isSalaried,
        selectedRegime: action.payload.regime,
        facts: newFacts,
      };
    }

    default:
      return state;
  }
}

const TaxContext = createContext<any>(null);

export const TaxProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(taxReducer, INITIAL_STATE);

  // Single source of calculation: executes immediately on any dispatch
  const computation = useMemo(() => {
    return computeAY2026Tax({
      isSalaried: state.isSalaried,
      age: 28,
      grossSalary: state.facts.salary.userAmount,
      businessIncome: state.facts.consulting.userAmount,
      savingsInterest: state.facts.interest.userAmount,
      otherIncome: state.facts.other.userAmount,
      tdsPaid: state.facts.tds.userAmount,
      advanceTaxPaid: 0,
      section80C: state.facts.ded80c.userAmount,
      section80D: state.facts.ded80d.userAmount,
    });
  }, [state.facts, state.isSalaried]);

  return (
    <TaxContext.Provider value={{ state, dispatch, computation }}>
      {children}
    </TaxContext.Provider>
  );
};

export const useTax = () => useContext(TaxContext);
