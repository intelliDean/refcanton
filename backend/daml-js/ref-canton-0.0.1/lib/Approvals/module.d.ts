// Generated from Approvals.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 from '@daml.js/daml-prim-DA-Types-1.0.0';
import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from '@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0';

import * as Assets from '../Assets/module';
import * as Loan from '../Loan/module';

export declare type AcceptAndFund = {
  recipientA: damlTypes.Party;
  newLockedCollateralCid: damlTypes.ContractId<Assets.LockedCollateralHolding>;
};

export declare const AcceptAndFund:
  damlTypes.Serializable<AcceptAndFund> & {
  }
;


export declare type WithdrawOffer = {
};

export declare const WithdrawOffer:
  damlTypes.Serializable<WithdrawOffer> & {
  }
;


export declare type ReplacementOffer = {
  lenderB: damlTypes.Party;
  borrower: damlTypes.Party;
  operator: damlTypes.Party;
  newPrincipal: damlTypes.Numeric;
  maturityDate: damlTypes.Date;
  collateralInstrument: string;
  collateralUnits: damlTypes.Numeric;
  lenderBCashCid: damlTypes.ContractId<Assets.CashHolding>;
  cashInstrument: string;
  expiresAt: damlTypes.Time;
  capRate: damlTypes.Numeric;
  amortizationPeriods: damlTypes.Int;
};

export declare interface ReplacementOfferInterface {
  WithdrawOffer: damlTypes.Choice<ReplacementOffer, WithdrawOffer, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ReplacementOffer, undefined>>;
  Archive: damlTypes.Choice<ReplacementOffer, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ReplacementOffer, undefined>>;
  AcceptAndFund: damlTypes.Choice<ReplacementOffer, AcceptAndFund, pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2<damlTypes.ContractId<Assets.CashHolding>, damlTypes.ContractId<Loan.LoanB>>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<ReplacementOffer, undefined>>;
}
export declare const ReplacementOffer:
  damlTypes.Template<ReplacementOffer, undefined, '#ref-canton:Approvals:ReplacementOffer'> &
  damlTypes.ToInterface<ReplacementOffer, never> &
  ReplacementOfferInterface;

export declare namespace ReplacementOffer {
}



export declare type SettleAndRepledge = {
  newLocker: damlTypes.Party;
  collateralCid: damlTypes.ContractId<Assets.LockedCollateralHolding>;
};

export declare const SettleAndRepledge:
  damlTypes.Serializable<SettleAndRepledge> & {
  }
;


export declare type WithdrawQuote = {
};

export declare const WithdrawQuote:
  damlTypes.Serializable<WithdrawQuote> & {
  }
;


export declare type PayoffQuote = {
  lenderA: damlTypes.Party;
  borrower: damlTypes.Party;
  loanACid: damlTypes.ContractId<Loan.LoanA>;
  payoffAmount: damlTypes.Numeric;
  instrument: string;
  expiresAt: damlTypes.Time;
};

export declare interface PayoffQuoteInterface {
  WithdrawQuote: damlTypes.Choice<PayoffQuote, WithdrawQuote, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PayoffQuote, undefined>>;
  SettleAndRepledge: damlTypes.Choice<PayoffQuote, SettleAndRepledge, damlTypes.ContractId<Assets.LockedCollateralHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PayoffQuote, undefined>>;
  Archive: damlTypes.Choice<PayoffQuote, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<PayoffQuote, undefined>>;
}
export declare const PayoffQuote:
  damlTypes.Template<PayoffQuote, undefined, '#ref-canton:Approvals:PayoffQuote'> &
  damlTypes.ToInterface<PayoffQuote, never> &
  PayoffQuoteInterface;

export declare namespace PayoffQuote {
}


