<script lang="ts">
</script>

<div class="card">
  <div class="card-header">
    <slot name="header" />
  </div>
  <div class="card-contents">
    <slot />
  </div>
  <div class="card-footer">
    <slot name="footer" />
  </div>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 16px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease-in-out;
  }

  .card:hover {
    transform: translateY(-2px);
  }

  .card-header {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .card-contents {
    flex-grow: 1;
    font-size: 1rem;
    color: #333;
  }

  .card-footer {
    margin-top: auto;
    text-align: right;
    font-size: 0.875rem;
    color: #666;
  }
</style>
