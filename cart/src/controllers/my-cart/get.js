import parse from 'co-parse';

var common = require('../helpers').common;
var log = common.logger;
var events = common.events;
var intents = common.intents;
var _ = require('lodash');
var publish = events.publish;
var verify = intents.verifyIntent;
var type = Cart._usergrid.type;
var async = require('async');
var make404 = require('../util').make404;

var OPEN_CRITERIA = { status: 'open' };

export default function*() {
  this.verifyParams({
    id: 'string'
  });

  let body = yield parse(this);
  let req = this.req;
  let res = this.res;

  var id = this.params.id;
  if (!id) { return res.json(400, 'missing id'); }
  var criteria = { _id: id };
  _.assign(criteria, OPEN_CRITERIA);
  var me = req.user;

  async.waterfall([
    function*() {
      yield me.findCartsBy(criteria, 1);
    },
    function*(carts) {
      if (carts.length === 0) { yield make404(); }
      yield carts[0];
    },
    function*(cart) {
      yield cart.fetchItems();
    }
  ], function(err, cart) {
      if (err) { sendError(res, err); }
      log.debug('%s found %s', type, id);
      res.json(cart);
  });
}
