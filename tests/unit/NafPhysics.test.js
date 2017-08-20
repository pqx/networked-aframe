/* global assert, process, setup, suite, test */
var aframe = require('aframe');
var helpers = require('./helpers');
var utils = require('../../src/utils');
var aframePhysics = require('aframe-physics-system');
aframePhysics.registerAll();

var physics = require('../../src/NafPhysics');

var cannonTypeMap = {
  'dynamic': 1,
  'static': 2,
};

function createDefaultPhysicsData(type,timestamp) {
  var typeInt = cannonTypeMap[type];
  return {
    type: typeInt,
    hasConstraint: false,
    position: new CANNON.Vec3(), 
    quaternion: new CANNON.Quaternion(),
    velocity: new CANNON.Vec3(),
    angularVelocity: new CANNON.Vec3(),
    timestamp: timestamp
  };
}

function assertPhysicsDataWithoutGeo(assert, result, expected) {
  assert.equal(result.type, expected.type, 'type');
  assert.equal(result.hasConstraint, expected.hasConstraint, 'hasConstraint');
  assert.instanceOf(result.position, CANNON.Vec3);
  assert.instanceOf(result.quaternion, CANNON.Quaternion);
  assert.instanceOf(result.velocity, CANNON.Vec3);
  assert.instanceOf(result.angularVelocity, CANNON.Vec3);
  assert.equal(result.timestamp, expected.timestamp);
}

suite('NafPhysics', function() {
  var scene;
  var elNaked;
  var elStatic;
  var elDynamic;
  var elConstraint1;
  var elConstraint2;

  function initScene(done) {
    var opts = {};
    opts.entities = [];
    opts.entities.push('<a-box id="naked"></a-box>');
    opts.entities.push('<a-box id="static" static-body></a-box>');
    opts.entities.push('<a-box id="dynamic" dynamic-body></a-box>');
    opts.entities.push('<a-box id="constraint1" constraint="target: #constraint2;" dynamic-body></a-box>');
    opts.entities.push('<a-box id="constraint2" dynamic-body></a-box>');
    scene = helpers.sceneFactory(opts);
    NAF.utils.whenEntityLoaded(scene, done);
  }

  setup(function(done) {
    initScene(function() {
      elNaked = document.querySelector('#naked');
      elStatic = document.querySelector('#static');
      elDynamic = document.querySelector('#dynamic');
      elConstraint1 = document.querySelector('#constraint1');
      elConstraint2 = document.querySelector('#constraint2');
      done();
    });
  });

  teardown(function() {
    scene.parentElement.removeChild(scene);
  });

  suite('setup', function() {
    test('setup worked and el has static-body component', function() {
      var result = elStatic.components['static-body'];

      assert.isOk(result);
    });

    test('setup worked and el has body', function() {
      var result = elStatic.body;

      assert.isOk(result);
    });
  });

  suite('getConstraints', function() {

    test('no physics component', function() {
      var result = physics.getConstraints(elNaked);

      assert.isArray(result);
      assert.equal(result.length, 0);
    });

    test('static-body has no constraints', function() {
      var result = physics.getConstraints(elStatic);

      assert.isArray(result);
      assert.equal(result.length, 0);
    });

    test('dynamic-body without constraint', function() {
      var result = physics.getConstraints(elDynamic);

      assert.isArray(result);
      assert.equal(result.length, 0);
    });

    test('dynamic-body with constraint component', function() {
      var result = physics.getConstraints(elConstraint1);

      assert.isArray(result);
      assert.equal(result.length, 1);
      assert.instanceOf(result[0], CANNON.Constraint);
    });

    test('dynamic-body with constraint targeting it', function() {
      var result = physics.getConstraints(elConstraint2);

      assert.isArray(result);
      assert.equal(result.length, 1);
      assert.instanceOf(result[0], CANNON.Constraint);
    });
  });

  suite('getPhysicsData', function() {

    test('no physics component', function() {
      var result = physics.getPhysicsData(elNaked);

      assert.isNull(result);
    });

    test('has static-body physics component with default values', sinon.test(function() {
      var timestamp = 10;
      this.stub(NAF.utils, 'now').returns(timestamp);

      var result = physics.getPhysicsData(elStatic);

      var expected = createDefaultPhysicsData('static', timestamp);
      assertPhysicsDataWithoutGeo(assert, result, expected)
    }));

    test('has dynamic-body physics component with default values', sinon.test(function() {
      var timestamp = 10;
      this.stub(NAF.utils, 'now').returns(timestamp);

      var result = physics.getPhysicsData(elDynamic);

      var expected = createDefaultPhysicsData('dynamic', timestamp);
      assertPhysicsDataWithoutGeo(assert, result, expected)
    }));

    test('has dynamic-body physics component with constraint', sinon.test(function() {
      var timestamp = 10;
      this.stub(NAF.utils, 'now').returns(timestamp);

      var result = physics.getPhysicsData(elConstraint1);

      var expected = createDefaultPhysicsData('dynamic', timestamp);
      expected.hasConstraint = true;
      assertPhysicsDataWithoutGeo(assert, result, expected)
    }));
  });

});