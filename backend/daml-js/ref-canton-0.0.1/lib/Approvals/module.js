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

var Assets = require('../Assets/module');
var Loan = require('../Loan/module');


exports.AcceptAndFund = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({recipientA: damlTypes.Party.decoder, newLockedCollateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).decoder, }); }),
  encode: function (__typed__) {
  return {
    recipientA: damlTypes.Party.encode(__typed__.recipientA),
    newLockedCollateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).encode(__typed__.newLockedCollateralCid),
  };
}
,
};



exports.WithdrawOffer = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.ReplacementOffer = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Approvals:ReplacementOffer',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Approvals:ReplacementOffer',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({lenderB: damlTypes.Party.decoder, borrower: damlTypes.Party.decoder, operator: damlTypes.Party.decoder, newPrincipal: damlTypes.Numeric(10).decoder, maturityDate: damlTypes.Date.decoder, collateralInstrument: damlTypes.Text.decoder, collateralUnits: damlTypes.Numeric(10).decoder, lenderBCashCid: damlTypes.ContractId(Assets.CashHolding).decoder, cashInstrument: damlTypes.Text.decoder, expiresAt: damlTypes.Time.decoder, capRate: damlTypes.Numeric(10).decoder, amortizationPeriods: damlTypes.Int.decoder, }); }),
  encode: function (__typed__) {
  return {
    lenderB: damlTypes.Party.encode(__typed__.lenderB),
    borrower: damlTypes.Party.encode(__typed__.borrower),
    operator: damlTypes.Party.encode(__typed__.operator),
    newPrincipal: damlTypes.Numeric(10).encode(__typed__.newPrincipal),
    maturityDate: damlTypes.Date.encode(__typed__.maturityDate),
    collateralInstrument: damlTypes.Text.encode(__typed__.collateralInstrument),
    collateralUnits: damlTypes.Numeric(10).encode(__typed__.collateralUnits),
    lenderBCashCid: damlTypes.ContractId(Assets.CashHolding).encode(__typed__.lenderBCashCid),
    cashInstrument: damlTypes.Text.encode(__typed__.cashInstrument),
    expiresAt: damlTypes.Time.encode(__typed__.expiresAt),
    capRate: damlTypes.Numeric(10).encode(__typed__.capRate),
    amortizationPeriods: damlTypes.Int.encode(__typed__.amortizationPeriods),
  };
}
,
  WithdrawOffer: {
    template: function () { return exports.ReplacementOffer; },
    choiceName: 'WithdrawOffer',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.WithdrawOffer.decoder; }),
    argumentEncode: function (__typed__) { return exports.WithdrawOffer.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.ReplacementOffer; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  AcceptAndFund: {
    template: function () { return exports.ReplacementOffer; },
    choiceName: 'AcceptAndFund',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.AcceptAndFund.decoder; }),
    argumentEncode: function (__typed__) { return exports.AcceptAndFund.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2(damlTypes.ContractId(Assets.CashHolding), damlTypes.ContractId(Loan.LoanB)).decoder; }),
    resultEncode: function (__typed__) { return pkg5aee9b21b8e9a4c4975b5f4c4198e6e6e8469df49e2010820e792f393db870f4.DA.Types.Tuple2(damlTypes.ContractId(Assets.CashHolding), damlTypes.ContractId(Loan.LoanB)).encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.ReplacementOffer, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);



exports.SettleAndRepledge = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({newLocker: damlTypes.Party.decoder, collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).decoder, }); }),
  encode: function (__typed__) {
  return {
    newLocker: damlTypes.Party.encode(__typed__.newLocker),
    collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).encode(__typed__.collateralCid),
  };
}
,
};



exports.WithdrawQuote = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({}); }),
  encode: function (__typed__) {
  return {
  };
}
,
};



exports.PayoffQuote = damlTypes.assembleTemplate(
{
  templateId: '#ref-canton:Approvals:PayoffQuote',
  templateIdWithPackageId: '84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698:Approvals:PayoffQuote',
  keyDecoder: damlTypes.lazyMemo(function () { return jtv.constant(undefined); }),
  keyEncode: function () { throw 'EncodeError'; },
  decoder: damlTypes.lazyMemo(function () { return jtv.object({lenderA: damlTypes.Party.decoder, borrower: damlTypes.Party.decoder, loanACid: damlTypes.ContractId(Loan.LoanA).decoder, payoffAmount: damlTypes.Numeric(10).decoder, instrument: damlTypes.Text.decoder, expiresAt: damlTypes.Time.decoder, }); }),
  encode: function (__typed__) {
  return {
    lenderA: damlTypes.Party.encode(__typed__.lenderA),
    borrower: damlTypes.Party.encode(__typed__.borrower),
    loanACid: damlTypes.ContractId(Loan.LoanA).encode(__typed__.loanACid),
    payoffAmount: damlTypes.Numeric(10).encode(__typed__.payoffAmount),
    instrument: damlTypes.Text.encode(__typed__.instrument),
    expiresAt: damlTypes.Time.encode(__typed__.expiresAt),
  };
}
,
  WithdrawQuote: {
    template: function () { return exports.PayoffQuote; },
    choiceName: 'WithdrawQuote',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.WithdrawQuote.decoder; }),
    argumentEncode: function (__typed__) { return exports.WithdrawQuote.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
  SettleAndRepledge: {
    template: function () { return exports.PayoffQuote; },
    choiceName: 'SettleAndRepledge',
    argumentDecoder: damlTypes.lazyMemo(function () { return exports.SettleAndRepledge.decoder; }),
    argumentEncode: function (__typed__) { return exports.SettleAndRepledge.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.ContractId(Assets.LockedCollateralHolding).decoder; }),
    resultEncode: function (__typed__) { return damlTypes.ContractId(Assets.LockedCollateralHolding).encode(__typed__); },
  },
  Archive: {
    template: function () { return exports.PayoffQuote; },
    choiceName: 'Archive',
    argumentDecoder: damlTypes.lazyMemo(function () { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.decoder; }),
    argumentEncode: function (__typed__) { return pkg9e70a8b3510d617f8a136213f33d6a903a10ca0eeec76bb06ba55d1ed9680f69.DA.Internal.Template.Archive.encode(__typed__); },
    resultDecoder: damlTypes.lazyMemo(function () { return damlTypes.Unit.decoder; }),
    resultEncode: function (__typed__) { return damlTypes.Unit.encode(__typed__); },
  },
}

);


damlTypes.registerTemplate(exports.PayoffQuote, ['84cd5fd6030e85c2e48a79b35f6a23d65af07a67f32f35d492dce8d5eb4f7698', '#ref-canton']);

