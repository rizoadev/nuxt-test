<template lang="pug">
div.crt
    div(style="width:90%;height:30px;border:solid 1px #ccc;", @click="doCrot") crot
        div(v-if="res.loading") loading...
</template>

<script>
import {
    reactive
} from 'nuxt-composition-api';
export default {
    setup() {
        const res = reactive({
            loading: false
        });
        const doCrot = () => {
            res.loading = true;
        };

        return {
            res,
            doCrot
        };
    }
};
</script>
