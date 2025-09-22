import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressRing from '@/components/ProgressRing.vue'

describe('ProgressRing', () => {
  it('renders with default props', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 50
      }
    })

    expect(wrapper.find('.progress-ring').exists()).toBe(true)
    expect(wrapper.find('.progress-ring-svg').exists()).toBe(true)
    expect(wrapper.find('.progress-percentage').text()).toBe('50%')
  })

  it('calculates dimensions correctly', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 75,
        size: 100,
        strokeWidth: 10
      }
    })

    const vm = wrapper.vm as any
    expect(vm.center).toBe(50) // size / 2
    expect(vm.radius).toBe(45) // (size - strokeWidth) / 2
    expect(vm.circumference).toBeCloseTo(282.74, 1) // 2 * PI * radius
  })

  it('calculates stroke dash offset correctly', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 25,
        size: 100,
        strokeWidth: 10
      }
    })

    const vm = wrapper.vm as any
    const expectedOffset = vm.circumference - (25 / 100) * vm.circumference
    expect(vm.strokeDashoffset).toBeCloseTo(expectedOffset, 1)
  })

  it('handles progress bounds correctly', () => {
    // Test progress > 100
    const wrapper1 = mount(ProgressRing, {
      props: {
        progress: 150
      }
    })
    expect(wrapper1.find('.progress-percentage').text()).toBe('150%')

    // Test progress < 0
    const wrapper2 = mount(ProgressRing, {
      props: {
        progress: -10
      }
    })
    expect(wrapper2.find('.progress-percentage').text()).toBe('-10%')
  })

  it('applies custom colors correctly', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 60,
        color: '#FF0000'
      }
    })

    const progressCircle = wrapper.find('.progress-ring-progress')
    expect(progressCircle.attributes('stroke')).toBe('#FF0000')
  })

  it('shows label when provided', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 80,
        label: 'Complete'
      }
    })

    expect(wrapper.find('.progress-label').exists()).toBe(true)
    expect(wrapper.find('.progress-label').text()).toBe('Complete')
  })

  it('hides label when not provided', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 80
      }
    })

    expect(wrapper.find('.progress-label').exists()).toBe(false)
  })

  it('applies custom size styling', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 40,
        size: 150
      }
    })

    const progressRing = wrapper.find('.progress-ring')
    expect(progressRing.attributes('style')).toContain('width: 150px')
    expect(progressRing.attributes('style')).toContain('height: 150px')
  })

  it('sets SVG attributes correctly', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 30,
        size: 120,
        strokeWidth: 8
      }
    })

    const svg = wrapper.find('.progress-ring-svg')
    expect(svg.attributes('width')).toBe('120')
    expect(svg.attributes('height')).toBe('120')

    const circles = wrapper.findAll('circle')
    expect(circles).toHaveLength(2) // background and progress circles

    const backgroundCircle = circles[0]
    const progressCircle = circles[1]

    expect(backgroundCircle.attributes('stroke-width')).toBe('8')
    expect(progressCircle.attributes('stroke-width')).toBe('8')
    expect(backgroundCircle.attributes('stroke')).toBe('#F2F2F7')
  })

  it('applies stroke linecap correctly', () => {
    const wrapper = mount(ProgressRing, {
      props: {
        progress: 70,
        strokeLinecap: 'square'
      }
    })

    const progressCircle = wrapper.find('.progress-ring-progress')
    expect(progressCircle.attributes('stroke-linecap')).toBe('square')
  })
})