<script lang="ts">
  import { Fa } from 'svelte-fa';
  import { faXmark } from '@fortawesome/free-solid-svg-icons';
  import { browser } from '$app/environment';

  let { title, isOpen = $bindable(false), closeOffcanvas, children } = $props();

  let offcanvasTabElement: HTMLDivElement | undefined = $state();
  let offcanvasBackdropElement: HTMLDivElement | undefined = $state();
  let currentOffcanvasHeight = $state(browser ? window.innerHeight * 0.6 : 300); // 초기 높이는 화면 높이의 60%
  let isDragging = $state(false);
  let startYPos = $state(0);
  let startHeight = $state(0);

  function handleCloseOffcanvas() {
    offcanvasTabElement?.classList.remove('offcanvas-tab-enter-active');
    offcanvasTabElement?.classList.add('offcanvas-tab-leave-active');
    // 애니메이션이 끝난 후 offcanvas를 닫음
    setTimeout(() => {
      closeOffcanvas();
      offcanvasTabElement?.classList.remove('offcanvas-tab-leave-active');
    }, 300); // 애니메이션 시간과 일치시킴
  }

  // 드래그 시 오프캔버스 탭의 높이를 조정하는 함수
  function handleDragStart(event: MouseEvent | TouchEvent) {
    isDragging = true;
    startYPos = 'touches' in event ? event.touches[0].clientY : event.clientY;

    if (offcanvasTabElement) {
      startHeight = offcanvasTabElement.offsetHeight;
    } else {
      startHeight = currentOffcanvasHeight;
    }

    //드래그 시 발생하는 기본 동작을 방지
    event.preventDefault();

    // 마우스나 터치 이벤트 리스너를 추가하여 드래그 중 높이 조정 기능을 활성화
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('touchmove', handleDrag);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);
  }

  function handleDrag(event: MouseEvent | TouchEvent) {
    if (!isDragging) return;

    const currentY =
      'touches' in event ? event.touches[0].clientY : event.clientY;
    const deltaY = currentY - startYPos;

    let newHeight = startHeight - deltaY;

    const minHeight = 180; // 최소 높이 설정
    const maxHeight = window.innerHeight * 0.9; // 최대 높이 설정
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    currentOffcanvasHeight = newHeight;
  }

  function handleDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('touchmove', handleDrag);
    window.removeEventListener('mouseup', handleDragEnd);
    window.removeEventListener('touchend', handleDragEnd);
  }

  // 컴포넌트 소멸 시 window 이벤트 리스너 제거
  $effect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    //offcanvasTabElement?.addEventListener('wheel', preventDefault);
    //offcanvasTabElement?.addEventListener('touchmove', preventDefault);
    //offcanvasBackdropElement?.addEventListener('wheel', preventDefault);
    //offcanvasBackdropElement?.addEventListener('touchmove', preventDefault);
    return () => {
      // 드래그 중인 경우 이벤트 리스너 제거 (이벤트가 등록된 상태)
      if (isDragging) {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('touchmove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchend', handleDragEnd);
      }
    };
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="offcanvas-backdrop"
    bind:this={offcanvasBackdropElement}
    onclick={closeOffcanvas}
  ></div>
  <div
    class="offcanvas-tab"
    class:offcanvas-tab-enter-active={isOpen}
    class:offcanvas-tab-leave-active={false}
    bind:this={offcanvasTabElement}
    style="height: {currentOffcanvasHeight}px;"
  >
    <div
      class="offcanvas-tab-drag-handle"
      onmousedown={handleDragStart}
      ontouchstart={handleDragStart}
      role="slider"
      aria-label="Drag to resize"
      aria-valuemin={100}
      aria-valuemax={Math.round(window.innerHeight * 0.9)}
      aria-valuenow={currentOffcanvasHeight}
      tabindex="0"
    >
      <div class="drag-handle-indicator"></div>
    </div>
    <div class="offcanvas-tab-header">
      <span class="header-span">&nbsp;</span>
      <h3 class="header-title">{title}</h3>
      <button
        class="close-button"
        onclick={handleCloseOffcanvas}
        aria-label="Close offcanvas"
      >
        <Fa icon={faXmark} />
      </button>
    </div>
    <div
      class="offcanvas-tab-content"
      style="height: calc(100% - {currentOffcanvasHeight}px);"
    >
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .offcanvas-tab {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: var(--background-color);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    z-index: 1050;
    border-radius: 10px 10px 0 0;
  }

  @keyframes slideIn {
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(0);
    }
  }

  @keyframes slideOut {
    0% {
      transform: translateY(0);
    }
    100% {
      transform: translateY(100%);
    }
  }

  .offcanvas-tab-enter-active {
    animation: slideIn 0.3s ease-out;
  }

  .offcanvas-tab-leave-active {
    animation: slideOut 0.3s ease-out;
  }

  .offcanvas-tab-drag-handle {
    width: 100%;
    padding: 8px 0;
    cursor: ns-resize;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: var(--background-color);
    flex-shrink: 0;
  }

  .drag-handle-indicator {
    width: 10%;
    height: 5px;
    background-color: #bdbdbd;
    border-radius: 3px;
  }

  .offcanvas-tab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
  }

  .header-span {
    background: none;
    border: none;
    font-size: 1.2rem;
    padding: 5px;
  }

  .header-title {
    margin: 0;
    padding: 0;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    padding: 5px;
    cursor: pointer;
    line-height: 1;
  }

  .offcanvas-tab-content {
    padding: 0;
    flex-grow: 1;
  }

  .offcanvas-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040;
  }
</style>
