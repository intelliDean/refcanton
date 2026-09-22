// Generated from Assets.daml
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-use-before-define */
import * as jtv from '@mojotech/json-type-validation';
import * as damlTypes from '@daml/types';

import * as pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 from '@daml.js/daml-prim-DA-Types-1.0.0';
import * as pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 from '@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0';

export declare type Merge = {
  otherCid: damlTypes.ContractId<CashHolding>;
};

export declare const Merge:
  damlTypes.Serializable<Merge> & {
  }
;


export declare type TransferPartial = {
  recipient: damlTypes.Party;
  transferAmount: damlTypes.Numeric;
};

export declare const TransferPartial:
  damlTypes.Serializable<TransferPartial> & {
  }
;


export declare type Transfer = {
  recipient: damlTypes.Party;
};

export declare const Transfer:
  damlTypes.Serializable<Transfer> & {
  }
;


export declare type Deallocate = {
};

export declare const Deallocate:
  damlTypes.Serializable<Deallocate> & {
  }
;


export declare type Allocate = {
  forParty: damlTypes.Party;
};

export declare const Allocate:
  damlTypes.Serializable<Allocate> & {
  }
;


export declare type CashHolding = {
  owner: damlTypes.Party;
  operator: damlTypes.Party;
  instrument: string;
  amount: damlTypes.Numeric;
  allocatedFor: damlTypes.Optional<damlTypes.Party>;
};

export declare interface CashHoldingInterface {
  Allocate: damlTypes.Choice<CashHolding, Allocate, damlTypes.ContractId<CashHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CashHolding, undefined>>;
  Deallocate: damlTypes.Choice<CashHolding, Deallocate, damlTypes.ContractId<CashHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CashHolding, undefined>>;
  Transfer: damlTypes.Choice<CashHolding, Transfer, damlTypes.ContractId<CashHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CashHolding, undefined>>;
  TransferPartial: damlTypes.Choice<CashHolding, TransferPartial, pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2<damlTypes.ContractId<CashHolding>, damlTypes.ContractId<CashHolding>>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CashHolding, undefined>>;
  Archive: damlTypes.Choice<CashHolding, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CashHolding, undefined>>;
  Merge: damlTypes.Choice<CashHolding, Merge, damlTypes.ContractId<CashHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CashHolding, undefined>>;
}
export declare const CashHolding:
  damlTypes.Template<CashHolding, undefined, '#ref-canton:Assets:CashHolding'> &
  damlTypes.ToInterface<CashHolding, never> &
  CashHoldingInterface;

export declare namespace CashHolding {
}



export declare type Repledge = {
  newLocker: damlTypes.Party;
  newContext: string;
};

export declare const Repledge:
  damlTypes.Serializable<Repledge> & {
  }
;


export declare type Unlock = {
};

export declare const Unlock:
  damlTypes.Serializable<Unlock> & {
  }
;


export declare type LockedCollateralHolding = {
  owner: damlTypes.Party;
  operator: damlTypes.Party;
  locker: damlTypes.Party;
  instrument: string;
  amount: damlTypes.Numeric;
  context: string;
};

export declare interface LockedCollateralHoldingInterface {
  Unlock: damlTypes.Choice<LockedCollateralHolding, Unlock, damlTypes.ContractId<CollateralHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<LockedCollateralHolding, undefined>>;
  Repledge: damlTypes.Choice<LockedCollateralHolding, Repledge, damlTypes.ContractId<LockedCollateralHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<LockedCollateralHolding, undefined>>;
  Archive: damlTypes.Choice<LockedCollateralHolding, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<LockedCollateralHolding, undefined>>;
}
export declare const LockedCollateralHolding:
  damlTypes.Template<LockedCollateralHolding, undefined, '#ref-canton:Assets:LockedCollateralHolding'> &
  damlTypes.ToInterface<LockedCollateralHolding, never> &
  LockedCollateralHoldingInterface;

export declare namespace LockedCollateralHolding {
}



export declare type Lock = {
  locker: damlTypes.Party;
  context: string;
};

export declare const Lock:
  damlTypes.Serializable<Lock> & {
  }
;


export declare type CollateralHolding = {
  owner: damlTypes.Party;
  operator: damlTypes.Party;
  instrument: string;
  amount: damlTypes.Numeric;
};

export declare interface CollateralHoldingInterface {
  Lock: damlTypes.Choice<CollateralHolding, Lock, damlTypes.ContractId<LockedCollateralHolding>, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CollateralHolding, undefined>>;
  Archive: damlTypes.Choice<CollateralHolding, pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive, {}, undefined> & damlTypes.ChoiceFrom<damlTypes.Template<CollateralHolding, undefined>>;
}
export declare const CollateralHolding:
  damlTypes.Template<CollateralHolding, undefined, '#ref-canton:Assets:CollateralHolding'> &
  damlTypes.ToInterface<CollateralHolding, never> &
  CollateralHoldingInterface;

export declare namespace CollateralHolding {
}


