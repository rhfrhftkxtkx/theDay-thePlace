<script lang="ts">
  import { redirect } from '@sveltejs/kit';

  export let title: string = 'Card Holder';
  export let value: string = '';
</script>

<div class="detail-card-holder-title">
  <h4>{title}</h4>
  {#if value}
    <a
      class="detail-card-holder-more-button"
      href={`/common/${value.toLocaleLowerCase()}`}
    >
      {value}
    </a>
  {/if}
</div>
<div class="detail-card-holder">
  <div class="detail-card-holder-contents">
    <slot />
  </div>
</div>

<style>
  .detail-card-holder {
    display: flex;
    flex-direction: column;
    align-items: start;
    width: 100%;
    padding: 1rem 0 0 0;
    overflow: auto;
    margin: 0;
    margin-bottom: 1rem;
  }
  .detail-card-holder-title {
    width: 100%;
    display: flex;
    margin-bottom: 0;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .detail-card-holder-more-button {
    background-color: transparent;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: 1rem;
    text-decoration: underline;
  }

  .detail-card-holder-title h4 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-primary);
  }

  .detail-card-holder-contents {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    gap: 1rem;
    justify-content: center;
  }
</style>
