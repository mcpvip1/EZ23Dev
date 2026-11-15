import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSoundSynthesisSpec,
  parseSoundEnabled,
  shouldTriggerOverLimitSound,
} from './soundFeedback';

describe('soundFeedback pure logic', () => {
  it('parses sound enabled preferences with default true', () => {
    assert.equal(parseSoundEnabled(null), true);
    assert.equal(parseSoundEnabled(undefined), true);
    assert.equal(parseSoundEnabled(''), true);
    assert.equal(parseSoundEnabled('true'), true);
    assert.equal(parseSoundEnabled('1'), true);
    assert.equal(parseSoundEnabled('false'), false);
    assert.equal(parseSoundEnabled('0'), false);
    assert.equal(parseSoundEnabled('OFF'), false);
  });

  it('detects when a new over-limit number appears or existing excess increases', () => {
    // Empty -> still empty
    assert.equal(shouldTriggerOverLimitSound([], []), false);

    // Newly over-limit number 12
    assert.equal(
      shouldTriggerOverLimitSound([], [{ no: '12', over: 5000 }]),
      true,
    );

    // Unchanged over-limit state (e.g. bet added on a safe number 34)
    assert.equal(
      shouldTriggerOverLimitSound(
        [{ no: '12', over: 5000 }],
        [{ no: '12', over: 5000 }],
      ),
      false,
    );

    // Existing over-limit number 12 increases from 5,000 to 10,000 over limit
    assert.equal(
      shouldTriggerOverLimitSound(
        [{ no: '12', over: 5000 }],
        [{ no: '12', over: 10000 }],
      ),
      true,
    );

    // Over-limit exposure decreases (e.g. passed to carry) -> does not trigger alert
    assert.equal(
      shouldTriggerOverLimitSound(
        [{ no: '12', over: 10000 }],
        [{ no: '12', over: 3000 }],
      ),
      false,
    );
  });

  it('provides distinct synthesis specs for click vs overLimit alert', () => {
    const clickSpec = getSoundSynthesisSpec('click');
    const alertSpec = getSoundSynthesisSpec('overLimit');

    assert.equal(clickSpec.length, 1);
    assert.ok(clickSpec[0].durationSec < 0.05);
    assert.ok(clickSpec[0].startFreqHz > clickSpec[0].endFreqHz);

    assert.equal(alertSpec.length, 2);
    assert.ok(alertSpec[1].startFreqHz > alertSpec[0].startFreqHz);
    assert.ok(alertSpec[1].startTimeSec > alertSpec[0].startTimeSec);
  });
});
