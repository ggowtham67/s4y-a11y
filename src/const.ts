import type {Spec} from 'axe-core'

export const AXE_CONFIG: Spec = {
  rules: [
    {
      id: 'color-contrast',
      enabled: false
    },
    {
      id: 'region',
      enabled: false
    }
  ]
}

export const ALLOWED_FILE_STATUS = ['added', 'modified', 'renamed']
export const MD_THEAD = [
  'Impact',
  'Description',
  'Help',
  'Help URL',
  'Elements',
  'HTML'
]
