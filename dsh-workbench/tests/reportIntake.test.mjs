import test from 'node:test'
import assert from 'node:assert/strict'
import { intakePoint } from '../lib/client/ReportIntake.js'

test('抽离首帧保留原文位置，结束时所有切片收拢至洞心', () => {
  for (const [x,y] of [[-430,80],[150,350],[-20,-200],[0,0]]) {
    for (const along of [-300,0,300]) {
      const first = intakePoint(x,y,along,0)
      assert.ok(Math.abs(first.x - x - along) < 1e-8)
      assert.ok(Math.abs(first.y - y) < 1e-8)
      assert.equal(first.angle,0)
      assert.equal(first.scale,1)
      const last = intakePoint(x,y,along,1)
      assert.ok(Math.hypot(last.x,last.y) < 1e-8)
      assert.equal(last.scale,0)
    }
  }
})
test('长行卷入过程坐标有限，缩放连续递减', () => {
  let previous = 1
  for (let step=0;step<=1000;step++) {
    const point = intakePoint(-430,350,700,step/1000)
    assert.ok(Object.values(point).every(Number.isFinite))
    assert.ok(point.scale <= previous)
    previous = point.scale
  }
})

test('洞心四周的文字均顺时针收拢，不中途反转或向外甩出', () => {
  for (const [x,y] of [[-500,-100],[300,-180],[200,350],[-400,300]]) {
    for (const along of [-200,0,200]) {
      let previous = intakePoint(x,y,along,0)
      for (let step=1;step<100;step++) {
        const point = intakePoint(x,y,along,step/100)
        assert.ok(previous.x * point.y - previous.y * point.x >= -1e-8)
        assert.ok(Math.hypot(point.x,point.y) <= Math.hypot(previous.x,previous.y) + 1e-8)
        previous=point
      }
    }
  }
})
test('文字朝向与变形后的曲线切线一致，避免切片反向弯折', () => {
  for (const y of [-180,40,250]) for (const along of [-300,-100,100,300]) {
    for (const progress of [.1,.3,.5,.7,.9]) {
      const point=intakePoint(-200,y,along,progress)
      const next=intakePoint(-200,y,along+.01,progress)
      const tangent=point.angle*Math.PI/180
      const dx=next.x-point.x,dy=next.y-point.y
      const alignment=(Math.cos(tangent)*dx+Math.sin(tangent)*dy)/Math.hypot(dx,dy)
      assert.ok(alignment>.999)
    }
  }
})

test('抽离从静止起步，第一瞬间不会突然缩小或跳动', () => {
  for (const [x,y] of [[-500,-100],[150,250],[0,0]]) {
    for (const along of [-200,0,200]) {
      const first=intakePoint(x,y,along,0)
      const next=intakePoint(x,y,along,.001)
      assert.ok(Math.hypot(next.x-first.x,next.y-first.y)<.001)
      assert.ok(Math.abs(next.scaleX-first.scaleX)<.001)
    }
  }
})
