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

const validate = async (dom: Node): Promise<axe.AxeResults> => {
  return new Promise((resolve, reject) => {
    axe.configure(getAxeConfig())
    axe.run(dom, (e, r) => {
      if (!e) resolve(r)
      reject(e)
    })
  })
}

export default validate
