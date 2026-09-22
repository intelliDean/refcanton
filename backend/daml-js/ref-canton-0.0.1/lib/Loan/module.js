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

var pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69 = require('@daml.js/ghc-stdlib-DA-Internal-Template-1.0.0');

var Assets = require('../Assets/module');

exports.LoanInterface = damlTypes.assembleInterface(
  '#ref-canton:Loan:LoanInterface',
  '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Loan:LoanInterface',
  function () { return exports.LoanView; },
  {
    CloseByRefinancing: {
      template: function () { return exports.LoanInterface; },
      choiceName: 'CloseByRefinancing',
      argumentDecoder: damlTypes.lazyMemo(function () { return exports.CloseByRefinancing.decoder; }),
      argumentEncode: function (__typed__) { return exports.CloseByRefinancing.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
      resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
    },
    Archive: {
      template: function () { return exports.LoanInterface; },
      choiceName: 'Archive',
      argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
      argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
      resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
      resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
    },
  });



exports.LoanB = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Loan:LoanB',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Loan:LoanB',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({borrower: damlTypes.Party.decoder, lenderB: damlTypes.Party.decoder, operator: damlTypes.Party.decoder, principal: damlTypes.Numeric(10).decoder, maturityDate: damlTypes.Date.decoder, collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).decoder, capRate: damlTypes.Numeric(10).decoder, amortizationPeriods: damlTypes.Int.decoder, }); }),
  encode: function (__typed__) {
  return {
    borrower: damlTypes.Party.encode(__typed__.borrower),
    lenderB: damlTypes.Party.encode(__typed__.lenderB),
    operator: damlTypes.Party.encode(__typed__.operator),
    principal: damlTypes.Numeric(10).encode(__typed__.principal),
    maturityDate: damlTypes.Date.encode(__typed__.maturityDate),
    collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).encode(__typed__.collateralCid),
    capRate: damlTypes.Numeric(10).encode(__typed__.capRate),
    amortizationPeriods: damlTypes.Int.encode(__typed__.amortizationPeriods),
  };
}
,
  Archive: {
    template: function () { return exports.LoanB; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

, exports.LoanInterface
);


damlTypes.registerTemplate(exports.LoanB, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);



exports.LoanA = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Loan:LoanA',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Loan:LoanA',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({borrower: damlTypes.Party.decoder, lenderA: damlTypes.Party.decoder, operator: damlTypes.Party.decoder, principal: damlTypes.Numeric(10).decoder, maturityDate: damlTypes.Date.decoder, collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).decoder, annualRate: damlTypes.Numeric(10).decoder, originationDate: damlTypes.Date.decoder, }); }),
  encode: function (__typed__) {
  return {
    borrower: damlTypes.Party.encode(__typed__.borrower),
    lenderA: damlTypes.Party.encode(__typed__.lenderA),
    operator: damlTypes.Party.encode(__typed__.operator),
    principal: damlTypes.Numeric(10).encode(__typed__.principal),
    maturityDate: damlTypes.Date.encode(__typed__.maturityDate),
    collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).encode(__typed__.collateralCid),
    annualRate: damlTypes.Numeric(10).encode(__typed__.annualRate),
    originationDate: damlTypes.Date.encode(__typed__.originationDate),
  };
}
,
  Archive: {
    template: function () { return exports.LoanA; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

, exports.LoanInterface
);


damlTypes.registerTemplate(exports.LoanA, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);



exports.CloseByRefinancing = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.LoanView = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({borrower: damlTypes.Party.decoder, lender: damlTypes.Party.decoder, principal: damlTypes.Numeric(10).decoder, maturityDate: damlTypes.Date.decoder, collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).decoder, }); }),
  encode: function (__typed__) {
  return {
    borrower: damlTypes.Party.encode(__typed__.borrower),
    lender: damlTypes.Party.encode(__typed__.lender),
    principal: damlTypes.Numeric(10).encode(__typed__.principal),
    maturityDate: damlTypes.Date.encode(__typed__.maturityDate),
    collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).encode(__typed__.collateralCid),
  };
}
,
};

