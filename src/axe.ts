import axe, {Spec, RunCallback} from 'axe-core'

const getAxeConfig = (): Spec => {
  return {
    rules: [
      {
        id: 'color-contrast',
        enabled: false
      }
    ]
  }
}

const validate = (dom: Node, cb: RunCallback): void => {
  axe.configure(getAxeConfig())
  axe.run(dom, cb)
}

export default validate
