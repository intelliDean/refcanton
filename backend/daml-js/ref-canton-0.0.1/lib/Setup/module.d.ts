// Generated from Setup.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as Assets from '../Assets/module';
import * as Loan from '../Loan/module';

export declare type InitialLedgerState = {
  parties: TestParties;
  borrowerCashCid: damlTypes.ContractId<Assets.CashHolding>;
  lenderBCashCid: damlTypes.ContractId<Assets.CashHolding>;
  loanACid: damlTypes.ContractId<Loan.LoanA>;
  collateralCid: damlTypes.ContractId<Assets.LockedCollateralHolding>;
};

export declare const InitialLedgerState:
  damlTypes.Serializable<InitialLedgerState> & {
  }
;


export declare type TestParties = {
  operator: damlTypes.Party;
  borrower: damlTypes.Party;
  lenderA: damlTypes.Party;
  lenderB: damlTypes.Party;
};

export declare const TestParties:
  damlTypes.Serializable<TestParties> & {
  }
;

