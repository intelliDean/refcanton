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

var Assets = require('../Assets/module');
var Loan = require('../Loan/module');


exports.InitialLedgerState = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({parties: exports.TestParties.decoder, borrowerCashCid: damlTypes.ContractId(Assets.CashHolding).decoder, lenderBCashCid: damlTypes.ContractId(Assets.CashHolding).decoder, loanACid: damlTypes.ContractId(Loan.LoanA).decoder, collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).decoder, }); }),
  encode: function (__typed__) {
  return {
    parties: exports.TestParties.encode(__typed__.parties),
    borrowerCashCid: damlTypes.ContractId(Assets.CashHolding).encode(__typed__.borrowerCashCid),
    lenderBCashCid: damlTypes.ContractId(Assets.CashHolding).encode(__typed__.lenderBCashCid),
    loanACid: damlTypes.ContractId(Loan.LoanA).encode(__typed__.loanACid),
    collateralCid: damlTypes.ContractId(Assets.LockedCollateralHolding).encode(__typed__.collateralCid),
  };
}
,
};



exports.TestParties = {
  decoder: damlTypes.lazyMemo(function () { return jtv.object({operator: damlTypes.Party.decoder, borrower: damlTypes.Party.decoder, lenderA: damlTypes.Party.decoder, lenderB: damlTypes.Party.decoder, }); }),
  encode: function (__typed__) {
  return {
    operator: damlTypes.Party.encode(__typed__.operator),
    borrower: damlTypes.Party.encode(__typed__.borrower),
    lenderA: damlTypes.Party.encode(__typed__.lenderA),
    lenderB: damlTypes.Party.encode(__typed__.lenderB),
  };
}
,
};

