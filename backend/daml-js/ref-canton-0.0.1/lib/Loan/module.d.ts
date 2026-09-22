// Generated from Loan.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from '@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0';

import * as Assets from '../Assets/module';

export declare type LoanInterface = damlTypes.Interface<'#ref-canton:Loan:LoanInterface'> & LoanView;
export declare interface LoanInterfaceInterface {
  CloseByRefinancing: damlTypes.Choice<LoanInterface, CloseByRefinancing, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.InterfaceCompanion<LoanInterface, undefined>>;
  Archive: damlTypes.Choice<LoanInterface, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.InterfaceCompanion<LoanInterface, undefined>>;
}
export declare const LoanInterface:
  damlTypes.InterfaceCompanion<LoanInterface, undefined, '#ref-canton:Loan:LoanInterface'> &
  damlTypes.FromTemplate<LoanInterface, unknown> &
  LoanInterfaceInterface;


export declare type LoanB = {
  borrower: damlTypes.Party;
  lenderB: damlTypes.Party;
  operator: damlTypes.Party;
  principal: damlTypes.Numeric;
  maturityDate: damlTypes.Date;
  collateralCid: damlTypes.ContractId<Assets.LockedCollateralHolding>;
  capRate: damlTypes.Numeric;
  amortizationPeriods: damlTypes.Int;
};

export declare interface LoanBInterface {
  Archive: damlTypes.Choice<LoanB, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<LoanB, undefined>>;
}
export declare const LoanB:
  damlTypes.Template<LoanB, undefined, '#ref-canton:Loan:LoanB'> &
  damlTypes.ToInterface<LoanB, LoanInterface> &
  LoanBInterface;

export declare namespace LoanB {
}



export declare type LoanA = {
  borrower: damlTypes.Party;
  lenderA: damlTypes.Party;
  operator: damlTypes.Party;
  principal: damlTypes.Numeric;
  maturityDate: damlTypes.Date;
  collateralCid: damlTypes.ContractId<Assets.LockedCollateralHolding>;
  annualRate: damlTypes.Numeric;
  originationDate: damlTypes.Date;
};

export declare interface LoanAInterface {
  Archive: damlTypes.Choice<LoanA, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<LoanA, undefined>>;
}
export declare const LoanA:
  damlTypes.Template<LoanA, undefined, '#ref-canton:Loan:LoanA'> &
  damlTypes.ToInterface<LoanA, LoanInterface> &
  LoanAInterface;

export declare namespace LoanA {
}



export declare type CloseByRefinancing = {
};

export declare const CloseByRefinancing:
  damlTypes.Serializable<CloseByRefinancing> & {
  }
;


export declare type LoanView = {
  borrower: damlTypes.Party;
  lender: damlTypes.Party;
  principal: damlTypes.Numeric;
  maturityDate: damlTypes.Date;
  collateralCid: damlTypes.ContractId<Assets.LockedCollateralHolding>;
};

export declare const LoanView:
  damlTypes.Serializable<LoanView> & {
  }
;

