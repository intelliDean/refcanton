// Generated from Closing.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from '@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0';

import * as Approvals from '../Approvals/module';
import * as Assets from '../Assets/module';
import * as Loan from '../Loan/module';

export declare type Execute = {
};

export declare const Execute:
  damlTypes.Serializable<Execute> & {
  }
;


export declare type Cancel = {
};

export declare const Cancel:
  damlTypes.Serializable<Cancel> & {
  }
;


export declare type ClosingRequest = {
  borrower: damlTypes.Party;
  lenderA: damlTypes.Party;
  lenderB: damlTypes.Party;
  operator: damlTypes.Party;
  payoffQuoteCid: damlTypes.ContractId<Approvals.PayoffQuote>;
  replacementOfferCid: damlTypes.ContractId<Approvals.ReplacementOffer>;
  borrowerCashCid: damlTypes.ContractId<Assets.CashHolding>;
  loanACid: damlTypes.ContractId<Loan.LoanA>;
  collateralCid: damlTypes.ContractId<Assets.LockedCollateralHolding>;
};

export declare interface ClosingRequestInterface {
  Cancel: damlTypes.Choice<ClosingRequest, Cancel, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ClosingRequest, undefined>>;
  Archive: damlTypes.Choice<ClosingRequest, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ClosingRequest, undefined>>;
  Execute: damlTypes.Choice<ClosingRequest, Execute, damlTypes.ContractId<ClosingReceiptContract>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ClosingRequest, undefined>>;
}
export declare const ClosingRequest:
  damlTypes.Template<ClosingRequest, undefined, '#ref-canton:Closing:ClosingRequest'> &
  damlTypes.ToInterface<ClosingRequest, never> &
  ClosingRequestInterface;

export declare namespace ClosingRequest {
}



export declare type ClosingReceiptContract = {
  borrower: damlTypes.Party;
  lenderA: damlTypes.Party;
  lenderB: damlTypes.Party;
  operator: damlTypes.Party;
  receipt: ClosingReceipt;
};

export declare interface ClosingReceiptContractInterface {
  Archive: damlTypes.Choice<ClosingReceiptContract, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ClosingReceiptContract, undefined>>;
}
export declare const ClosingReceiptContract:
  damlTypes.Template<ClosingReceiptContract, undefined, '#ref-canton:Closing:ClosingReceiptContract'> &
  damlTypes.ToInterface<ClosingReceiptContract, never> &
  ClosingReceiptContractInterface;

export declare namespace ClosingReceiptContract {
}



export declare type ClosingReceipt = {
  loanBCid: damlTypes.ContractId<Loan.LoanB>;
  closedAt: damlTypes.Time;
  payoffAmount: damlTypes.Numeric;
  newPrincipal: damlTypes.Numeric;
  borrowerContribution: damlTypes.Numeric;
  collateralUnits: damlTypes.Numeric;
};

export declare const ClosingReceipt:
  damlTypes.Serializable<ClosingReceipt> & {
  }
;

