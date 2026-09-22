"use strict";
/* eslint-disable-next-line no-unused-vars */
function __export(m) {
/* eslint-disable-next-line no-prototype-builtins */
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable-next-line no-unused-vars */
var jtv = require('@mojotech/json-type-validation');
/* eslint-disable-next-line no-unused-vars */
var damlTypes = require('@daml/types');

var pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4 = require('@daml.js/daml-prim-DA-Types-1.0.0');
var pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 = require('@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0');


exports.Merge = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({otherCid: damlTypes.ContractId(exports.CashHolding).decoder, }); }),
  encode: function (__typed__) {
  return {
    otherCid: damlTypes.ContractId(exports.CashHolding).encode(__typed__.otherCid),
  };
}
,
};



exports.TransferPartial = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({recipient: damlTypes.Party.decoder, transferAmount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    recipient: damlTypes.Party.encode(__typed__.recipient),
    transferAmount: damlTypes.Numeric(10).encode(__typed__.transferAmount),
  };
}
,
};



exports.Transfer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({recipient: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    recipient: damlTypes.Party.encode(__typed__.recipient),
  };
}
,
};



exports.Deallocate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Allocate = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({forParty: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    forParty: damlTypes.Party.encode(__typed__.forParty),
  };
}
,
};



exports.CashHolding = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Assets:CashHolding',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Assets:CashHolding',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({owner: damlTypes.Party.decoder, operator: damlTypes.Party.decoder, instrument: damlTypes.Text.decoder, amount: damlTypes.Numeric(10).decoder, allocatedFor: jtv.Decoder.withDefault(null, damlTypes.Optional(damlTypes.Party).decoder), }); }),
  encode: function (__typed__) {
  return {
    owner: damlTypes.Party.encode(__typed__.owner),
    operator: damlTypes.Party.encode(__typed__.operator),
    instrument: damlTypes.Text.encode(__typed__.instrument),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    allocatedFor: damlTypes.Optional(damlTypes.Party).encode(__typed__.allocatedFor),
  };
}
,
  Allocate: {
    template: function () { return exports.CashHolding; },
    choiceName: 'Allocate',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Allocate.decoder; }),
    argumentEncode: function (__typed__) { return exports.Allocate.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CashHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CashHolding).encode(__typed__); },
  },
  Deallocate: {
    template: function () { return exports.CashHolding; },
    choiceName: 'Deallocate',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Deallocate.decoder; }),
    argumentEncode: function (__typed__) { return exports.Deallocate.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CashHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CashHolding).encode(__typed__); },
  },
  Transfer: {
    template: function () { return exports.CashHolding; },
    choiceName: 'Transfer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Transfer.decoder; }),
    argumentEncode: function (__typed__) { return exports.Transfer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CashHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CashHolding).encode(__typed__); },
  },
  TransferPartial: {
    template: function () { return exports.CashHolding; },
    choiceName: 'TransferPartial',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.TransferPartial.decoder; }),
    argumentEncode: function (__typed__) { return exports.TransferPartial.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2(damlTypes.ContractId(exports.CashHolding), damlTypes.ContractId(exports.CashHolding)).decoder; }),
    resultEncode: function (__typed__) { return pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2(damlTypes.ContractId(exports.CashHolding), damlTypes.ContractId(exports.CashHolding)).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.CashHolding; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Merge: {
    template: function () { return exports.CashHolding; },
    choiceName: 'Merge',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Merge.decoder; }),
    argumentEncode: function (__typed__) { return exports.Merge.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CashHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CashHolding).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.CashHolding, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);



exports.Repledge = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newLocker: damlTypes.Party.decoder, newContext: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    newLocker: damlTypes.Party.encode(__typed__.newLocker),
    newContext: damlTypes.Text.encode(__typed__.newContext),
  };
}
,
};



exports.Unlock = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.LockedCollateralHolding = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Assets:LockedCollateralHolding',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Assets:LockedCollateralHolding',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({owner: damlTypes.Party.decoder, operator: damlTypes.Party.decoder, locker: damlTypes.Party.decoder, instrument: damlTypes.Text.decoder, amount: damlTypes.Numeric(10).decoder, context: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    owner: damlTypes.Party.encode(__typed__.owner),
    operator: damlTypes.Party.encode(__typed__.operator),
    locker: damlTypes.Party.encode(__typed__.locker),
    instrument: damlTypes.Text.encode(__typed__.instrument),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
    context: damlTypes.Text.encode(__typed__.context),
  };
}
,
  Unlock: {
    template: function () { return exports.LockedCollateralHolding; },
    choiceName: 'Unlock',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Unlock.decoder; }),
    argumentEncode: function (__typed__) { return exports.Unlock.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.CollateralHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.CollateralHolding).encode(__typed__); },
  },
  Repledge: {
    template: function () { return exports.LockedCollateralHolding; },
    choiceName: 'Repledge',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Repledge.decoder; }),
    argumentEncode: function (__typed__) { return exports.Repledge.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.LockedCollateralHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.LockedCollateralHolding).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.LockedCollateralHolding; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.LockedCollateralHolding, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);



exports.Lock = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({locker: damlTypes.Party.decoder, context: damlTypes.Text.decoder, }); }),
  encode: function (__typed__) {
  return {
    locker: damlTypes.Party.encode(__typed__.locker),
    context: damlTypes.Text.encode(__typed__.context),
  };
}
,
};



exports.CollateralHolding = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Assets:CollateralHolding',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Assets:CollateralHolding',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({owner: damlTypes.Party.decoder, operator: damlTypes.Party.decoder, instrument: damlTypes.Text.decoder, amount: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    owner: damlTypes.Party.encode(__typed__.owner),
    operator: damlTypes.Party.encode(__typed__.operator),
    instrument: damlTypes.Text.encode(__typed__.instrument),
    amount: damlTypes.Numeric(10).encode(__typed__.amount),
  };
}
,
  Lock: {
    template: function () { return exports.CollateralHolding; },
    choiceName: 'Lock',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Lock.decoder; }),
    argumentEncode: function (__typed__) { return exports.Lock.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.LockedCollateralHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.LockedCollateralHolding).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.CollateralHolding; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.CollateralHolding, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);

