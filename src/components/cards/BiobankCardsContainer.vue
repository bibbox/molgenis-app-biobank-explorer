<template>
  <div class="biobank-cards-container">
    <div v-if="!loading && foundBiobanks > 0">
      <b-pagination
        v-if="foundBiobanks > pageSize"
        size="md"
        align="center"
        :total-rows="foundBiobanks"
        v-model="currentPage"
        :per-page="pageSize"
      ></b-pagination>
      <!-- <biobank-card
        v-for="biobank in biobanksShown"
        :key="biobank.id || biobank"
        :biobank="biobank"
        :initCollapsed="(biobanksShown[0].id !== biobank.id || biobanksShown[0] !== biobank)">
      </biobank-card> -->

      <div v-if="!loading && foundBiobanks > 0">
        <b-table
        responsive
        hover
        :items="biobank_items"
        :fields="[
          {
            key: 'Logo'
          },
          {
            key: 'Name',
            sortable: false,
          },
          {
            key: 'Ressource',
            sortable: false
          },
          {
            key: 'Number_of_cases',
            sortable: false
          },
          {
            key: 'Country',
            sortable: false
          }
        ]">
        <template v-slot:cell(Name)="ressource">
          <router-link :to="'/collection/' + ressource.item.id + ':collection_pa'">{{ressource.value}}</router-link>
        </template>
      </b-table>
      </div>
      <b-pagination
        v-if="foundBiobanks > pageSize"
        size="md"
        align="center"
        :total-rows="foundBiobanks"
        v-model="currentPage"
        :per-page="pageSize"
      ></b-pagination>
    </div>

    <div v-else-if="!loading && foundBiobanks === 0" class="status-text">
      <h4>No biobanks were found</h4>
    </div>

    <div v-else class="status-text">
      <h4>
        Loading data...
        <i class="fa fa-spinner fa-pulse" aria-hidden="true"></i>
      </h4>
    </div>
  </div>
</template>

<style>
.status-text {
  text-align: center;
  justify-content: center;
  padding: 1rem;
}

.biobank-cards-container {
  width: 100%;
}
</style>

<script>
// import BiobankCard from './BiobankCard'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'biobank-cards-container',
  data () {
    return {
      currentPage: 1,
      pageSize: 10,
      items: []
    }
  },
  methods: {
    ...mapActions(['GetBiobanks']),
    addNumberDonors (biobank) {
      var sum = 0
      for (const key in biobank.collections) {
        sum = sum + biobank.collections[key].number_of_donors
      }
      return sum
    }
  },
  computed: {
    ...mapGetters([
      'biobanks',
      'foundBiobanks',
      'loading'
    ]),
    biobanksShown () {
      return this.loading ? [] : this.biobanks.slice(this.pageSize * (this.currentPage - 1), this.pageSize * this.currentPage)
    },
    biobankIds () {
      return this.loading ? [] : this.biobanks.map(it => it.id || it)
    },
    biobankIdsToFetch () {
      return this.biobanksShown.filter(it => typeof it === 'string')
    },
    biobank_items () {
      // check if deeper objects (e.g.: ressource_types) can be loaded:
      if (!this.biobanksShown[0].ressource_types) {
        return []
      }
      const items = []
      for (const key in this.biobanksShown) {
        items.push({
          Logo: 'placeHolder',
          Name: this.biobanksShown[key].name,
          id: this.biobanksShown[key].id,
          Ressource: this.biobanksShown[key].ressource_types.label,
          Number_of_cases: this.addNumberDonors(this.biobanksShown[key]),
          Country: this.biobanksShown[key].country.name
        })
      }
      return items
    }
  },
  // components: {
  //   BiobankCard
  // },
  watch: {
    biobankIds (newValue, oldValue) {
      if (newValue.length !== oldValue.length ||
        !newValue.every((element, index) => element === oldValue[index])) {
        this.currentPage = 1
      }
    },
    biobankIdsToFetch (value) {
      if (value.length) {
        this.GetBiobanks(value)
      }
    }
  }
}
</script>
