import {definePlugin, ObjectSchemaType} from 'sanity'
import {assistInspector} from './assistInspector'
import {AssistFieldWrapper} from './assistFormComponents/AssistField'
import {AssistLayout} from './assistLayout/AssistLayout'
import {AssistFormBlock} from './assistFormComponents/AssistFormBlock'
import {AssistItem} from './assistFormComponents/AssistItem'
import {SanityClient} from '@sanity/client'
import {SafeValueInput} from './components/SafeValueInput'
import {schemaTypes} from './schemas'
import {AssistInlineFormBlock} from './assistFormComponents/AssistInlineFormBlock'
import {assistFieldActions} from './fieldActions/assistFieldActions'
import {packageName} from './constants'
import {AssistDocumentInputWrapper} from './assistDocument/AssistDocumentInput'
import {createAssistDocumentPresence} from './presence/AssistDocumentPresence'
import {isSchemaAssistEnabled} from './helpers/assistSupported'
import {isImage} from './helpers/typeUtils'
import {ImageContextProvider} from './components/ImageContext'

export interface AssistPluginConfig {
  /**
   * Set this to false to disable model migration from the alpha version of this plugin
   */
  alphaMigration?: boolean

  /**
   * @internal
   */
  __customApiClient?: (defaultClient: SanityClient) => SanityClient
}

export const assist = definePlugin<AssistPluginConfig | void>((config) => {
  const configWithDefaults = config ?? {}
  return {
    name: packageName,

    schema: {
      types: schemaTypes,
    },

    document: {
      inspectors: (prev, context) => {
        const docSchema = context.schema.get(context.documentType)
        if (docSchema && isSchemaAssistEnabled(docSchema)) {
          return [...prev, assistInspector]
        }
        return prev
      },
      unstable_fieldActions: (prev) => {
        return [...prev, assistFieldActions]
      },
      unstable_languageFilter: (prev, {documentId, schema, schemaType}) => {
        const docSchema = schema.get(schemaType) as ObjectSchemaType
        return [...prev, createAssistDocumentPresence(documentId, docSchema)]
      },
    },

    studio: {
      components: {
        layout: function Layout(props) {
          return <AssistLayout {...props} config={configWithDefaults} />
        },
      },
    },

    form: {
      components: {
        input: AssistDocumentInputWrapper,
        field: AssistFieldWrapper,
        item: AssistItem,
        block: AssistFormBlock,
        inlineBlock: AssistInlineFormBlock,
      },
    },

    plugins: [
      definePlugin({
        name: `${packageName}/safe-value-input`,
        form: {components: {input: SafeValueInput}},
      })(),

      definePlugin({
        name: `${packageName}/generate-caption`,
        form: {
          components: {
            input: (props) => {
              const {schemaType} = props

              if (isImage(schemaType)) {
                return <ImageContextProvider {...props} />
              }
              return props.renderDefault(props)
            },
          },
        },
      })(),
    ],
  }
})
