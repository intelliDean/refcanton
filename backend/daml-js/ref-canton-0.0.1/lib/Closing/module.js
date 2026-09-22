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

var Approvals = require('../Approvals/module');
var Assets = require('../Assets/module');
var Loan = require('../Loan/module');


exports.Execute = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.Cancel = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.ClosingRequest = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Closing:ClosingRequest',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Closing:ClosingRequest',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({borrower: damlTypes.Party.decoder, lenderA: damlTypes.Party.decoder, lenderB: damlTypes.Party.decoder, operator: damlTypes.Party.decoder, payoffQuoteCid: damlTypes.ContractId(Approvals.PayoffQuote).decoder, replacementOfferCid: damlTypes.ContractId(Approvals.ReplacementOffer).decoder, borrowerCashCid: damlTypes.ContractId(Assets.CashHolding).decoder, loanACid: damlTypes.ContractId(Loan.LoanA).decoder, collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).decoder, }); }),
  encode: function (__typed__) {
  return {
    borrower: damlTypes.Party.encode(__typed__.borrower),
    lenderA: damlTypes.Party.encode(__typed__.lenderA),
    lenderB: damlTypes.Party.encode(__typed__.lenderB),
    operator: damlTypes.Party.encode(__typed__.operator),
    payoffQuoteCid: damlTypes.ContractId(Approvals.PayoffQuote).encode(__typed__.payoffQuoteCid),
    replacementOfferCid: damlTypes.ContractId(Approvals.ReplacementOffer).encode(__typed__.replacementOfferCid),
    borrowerCashCid: damlTypes.ContractId(Assets.CashHolding).encode(__typed__.borrowerCashCid),
    loanACid: damlTypes.ContractId(Loan.LoanA).encode(__typed__.loanACid),
    collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).encode(__typed__.collateralCid),
  };
}
,
  Cancel: {
    template: function () { return exports.ClosingRequest; },
    choiceName: 'Cancel',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Cancel.decoder; }),
    argumentEncode: function (__typed__) { return exports.Cancel.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.ClosingRequest; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Execute: {
    template: function () { return exports.ClosingRequest; },
    choiceName: 'Execute',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.Execute.decoder; }),
    argumentEncode: function (__typed__) { return exports.Execute.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(exports.ClosingReceiptContract).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(exports.ClosingReceiptContract).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.ClosingRequest, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);



exports.ClosingReceiptContract = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Closing:ClosingReceiptContract',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Closing:ClosingReceiptContract',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({borrower: damlTypes.Party.decoder, lenderA: damlTypes.Party.decoder, lenderB: damlTypes.Party.decoder, operator: damlTypes.Party.decoder, receipt: exports.ClosingReceipt.decoder, }); }),
  encode: function (__typed__) {
  return {
    borrower: damlTypes.Party.encode(__typed__.borrower),
    lenderA: damlTypes.Party.encode(__typed__.lenderA),
    lenderB: damlTypes.Party.encode(__typed__.lenderB),
    operator: damlTypes.Party.encode(__typed__.operator),
    receipt: exports.ClosingReceipt.encode(__typed__.receipt),
  };
}
,
  Archive: {
    template: function () { return exports.ClosingReceiptContract; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.ClosingReceiptContract, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);



exports.ClosingReceipt = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({loanBCid: damlTypes.ContractId(Loan.LoanB).decoder, closedAt: damlTypes.Time.decoder, payoffAmount: damlTypes.Numeric(10).decoder, newPrincipal: damlTypes.Numeric(10).decoder, borrowerContribution: damlTypes.Numeric(10).decoder, collateralUnits: damlTypes.Numeric(10).decoder, }); }),
  encode: function (__typed__) {
  return {
    loanBCid: damlTypes.ContractId(Loan.LoanB).encode(__typed__.loanBCid),
    closedAt: damlTypes.Time.encode(__typed__.closedAt),
    payoffAmount: damlTypes.Numeric(10).encode(__typed__.payoffAmount),
    newPrincipal: damlTypes.Numeric(10).encode(__typed__.newPrincipal),
    borrowerContribution: damlTypes.Numeric(10).encode(__typed__.borrowerContribution),
    collateralUnits: damlTypes.Numeric(10).encode(__typed__.collateralUnits),
  };
}
,
};

