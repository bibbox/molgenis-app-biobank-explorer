import api from '@molgenis/molgenis-api-client'
import { getFilteredCollections, getHumanReadableString } from './utils/negotiator.query'
import {
  SET_BIOBANKS,
  SET_COUNTRIES,
  SET_DISEASE_TYPES,
  SET_ERROR,
  SET_LOADING,
  SET_MATERIAL_TYPES,
  SET_QUALITY
} from './mutations'

export const GET_BIOBANKS_AND_COLLECTIONS = '__GET_BIOBANKS_AND_COLLECTIONS__'
export const GET_BIOBANKS_BY_ID = '__GET_BIOBANKS_BY_ID__'
export const GET_BIOBANK_IDENTIFIERS = '__GET_BIOBANK_IDENTIFIERS__'
export const GET_COUNTRIES = '__GET_COUNTRIES__'
export const GET_MATERIAL_TYPES = '__GET_MATERIAL_TYPES__'
export const GET_QUALITY = '__GET_QUALITY__'
export const SEND_TO_NEGOTIATOR = '__SEND_TO_NEGOTIATOR__'
export const QUERY_DISEASE_TYPES = '__QUERY_DISEASE_TYPES__'

/**
 * Translate the identifiers used in the state to the names of the actual column names in the database
 *
 * @param attribute
 * @returns {*}
 */
const translateAttributeToColumnName = (attribute) => {
  switch (attribute) {
    case 'material_types':
      return 'materials.id'
    case 'quality':
      return 'standard.id'
    case 'countries':
      return 'country.id'
    case 'disease_types':
      return 'diagnosis_available.id'
  }
}

/**
 * Return an Array of unique biobank identifiers
 *
 * @param biobanks
 * @returns {Array}
 */
const getUniqueBiobanksIds = (biobanks) => {
  return Array.from(new Set(biobanks.map(biobank => biobank.biobank.id)))
}

export default {
  /**
   * Retrieve 100 biobanks with expanded collections
   *
   * @param commit
   */
  [GET_BIOBANKS_AND_COLLECTIONS] ({commit}) {
    commit(SET_LOADING, true)

    const uri = '/api/v2/eu_bbmri_eric_biobanks?attrs=collections(materials,standards,diagnosis_available,name,type,order_of_magnitude),*'
    api.get(uri).then(response => {
      commit(SET_BIOBANKS, response)
      commit(SET_LOADING, false)
    }, error => {
      commit(SET_ERROR, error)
    })
  },
  /**
   * Retrieve biobanks with expanded collections based on a list of biobank ids
   *
   * @param commit
   * @param biobanks
   */
  [GET_BIOBANKS_BY_ID] ({commit}, biobanks) {
    const biobankIds = getUniqueBiobanksIds(biobanks)
    const uri = '/api/v2/eu_bbmri_eric_biobanks?num=2000&attrs=collections(materials,standards,diagnosis_available,name,type,order_of_magnitude),*&num=2000&q=id=in=(' + biobankIds.join(',') + ')'

    api.get(uri).then(response => {
      commit(SET_BIOBANKS, response)
      commit(SET_LOADING, false)
    }, error => {
      commit(SET_ERROR, error)
    })
  },
  /**
   * Retrieve biobank identifiers for filters on collection.standards, collection.materials,
   * or collection.diagnosis_available.code
   *
   * @example queries
   * q=materials.id==RNA,materials.id==DNA
   * q=diagnosis_available.code==C18,diagnosis_available.code==L40
   * q=standards.id==cen-ts-16835-1-2015,standards.id==cen-ts-16827-1-2015
   *
   * @param state
   * @param commit
   * @param dispatch
   * @param filter
   */
  [GET_BIOBANK_IDENTIFIERS] ({commit, dispatch}, {options, attribute}) {
    commit(SET_LOADING, true)

    const column = translateAttributeToColumnName(attribute)
    api.get('/api/v2/eu_bbmri_eric_collections?num=2000&attrs=biobank&q=' + options.map(option => column + '==' + option).join(',')).then(response => {
      dispatch(GET_BIOBANKS_BY_ID, response.items)
    }, error => {
      commit(SET_ERROR, error)
    })
  },
  [GET_COUNTRIES] ({commit}) {
    api.get('/api/v2/eu_bbmri_eric_countries').then(response => {
      commit(SET_COUNTRIES, response.items)
    }, error => {
      commit(SET_ERROR, error)
    })
  },
  [GET_MATERIAL_TYPES] ({commit}) {
    api.get('/api/v2/eu_bbmri_eric_material_types').then(response => {
      commit(SET_MATERIAL_TYPES, response.items)
    }, error => {
      commit(SET_ERROR, error)
    })
  },
  [GET_QUALITY] ({commit}) {
    api.get('/api/v2/eu_bbmri_eric_lab_standards').then(response => {
      commit(SET_QUALITY, response.items)
    }, error => {
      commit(SET_ERROR, error)
    })
  },
  [QUERY_DISEASE_TYPES] ({commit}, query) {
    if (query) {
      api.get('/api/v2/eu_bbmri_eric_disease_types?num=20&q=label=q=' + query + ',id=q=' + query).then(response => {
        commit(SET_DISEASE_TYPES, response.items)
      }, error => {
        commit(SET_ERROR, error)
      })
    } else {
      commit(SET_DISEASE_TYPES, [])
    }
  },
  [SEND_TO_NEGOTIATOR] ({state}) {
    // Remove the nToken from the URL to prevent duplication on the negotiator side
    // when a query is edited more than once
    const url = window.location.href.replace(/&nToken=\w{32}/, '')
    const collections = getFilteredCollections(state)
    const humanReadable = getHumanReadableString(state)

    const negotiatorQuery = {
      URL: url,
      collections: collections,
      humanReadable: humanReadable,
      nToken: state.nToken
    }

    const options = {
      body: JSON.stringify(negotiatorQuery)
    }

    api.post('/plugin/directory/export', options).then(response => {
      window.location.href = response
    }, error => {
      console.log(error)
    })
  }
}
