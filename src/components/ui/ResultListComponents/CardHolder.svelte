<script lang="ts">
  import { redirect } from '@sveltejs/kit';

  export let title: string = 'Card Holder';
  export let value: string = '';
</script>

<div class="card-holder-title">
  <h4>{title}</h4>
  {#if value}
    <a
      class="card-holder-more-button"
      href={`/common/${value.toLocaleLowerCase()}`}
    >
      {value}
    </a>
  {/if}
</div>
<div class="card-holder">
  <div class="card-holder-contents">
    <slot />
  </div>
</div>

<style>
  .card-holder {
    display: flex;
    flex-direction: column;
    align-items: start;
    width: 100%;
    padding: 1rem;
    overflow: auto;
    margin-bottom: 1rem;
  }
  .card-holder-title {
    width: 100%;
    display: flex;
    margin-bottom: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .card-holder-more-button {
    background-color: transparent;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: 1rem;
    text-decoration: underline;
  }

  .card-holder-title h4 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-primary);
  }

  .card-holder-contents {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    justify-content: center;
  }
</style>
