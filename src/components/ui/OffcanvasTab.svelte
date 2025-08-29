<script lang="ts">
  import { Fa } from 'svelte-fa';
  import { faXmark } from '@fortawesome/free-solid-svg-icons';
  import { browser } from '$app/environment';
  import { fly } from 'svelte/transition';
  import { quadOut } from 'svelte/easing';

  let {
    title,
    isOpen = $bindable(false),
    closeOffcanvas,
    initialHeight = browser ? window.innerHeight * 0.6 : 300,
    children,
  } = $props();

  let offcanvasTabElement: HTMLDivElement | undefined = $state();
  let offcanvasBackdropElement: HTMLDivElement | undefined = $state();
  let currentOffcanvasHeight = $state(initialHeight); // 초기 높이는 화면 높이의 60%
  let isDragging = $state(false);
  let startYPos = $state(0);
  let startHeight = $state(0);

  function handleCloseOffcanvas() {
    //offcanvasTabElement?.classList.remove('offcanvas-tab-enter-active');
    //offcanvasTabElement?.classList.add('offcanvas-tab-leave-active');
    // 애니메이션이 끝난 후 offcanvas를 닫음
    // setTimeout(() => {
    closeOffcanvas();
    //   offcanvasTabElement?.classList.remove('offcanvas-tab-leave-active');
    // }, 300); // 애니메이션 시간과 일치시킴
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

    const minHeight = 80; // 최소 높이 설정
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
    class="fixed w-full h-full top-0 left-0 right-0 bottom-0 bg-black/30 z-1040"
    bind:this={offcanvasBackdropElement}
    onclick={closeOffcanvas}
  ></div>
{/if}
<div
  class="fixed flex flex-col bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-700 shadow-[0_-2px_20px_10px] shadow-black/30 overflow-hidden z-1050 rounded-t-xl"
  transition:fly={{ y: initialHeight, duration: 300, easing: quadOut }}
  bind:this={offcanvasTabElement}
  style="height: {currentOffcanvasHeight}px;"
>
  <div
    class="w-full py-2 h-4 cursor-ns-resize flex justify-center items-center shrink-0"
    onmousedown={handleDragStart}
    ontouchstart={handleDragStart}
    role="slider"
    aria-label="Drag to resize"
    aria-valuemin={100}
    aria-valuemax={browser ? Math.round(window.innerHeight * 0.9) : 450}
    aria-valuenow={currentOffcanvasHeight}
    tabindex="0"
  >
    <div class="w-20 h-1 bg-gray-300 rounded-full"></div>
  </div>
  <div
    class="flex justify-between items-center py-3 px-4 border border-gray-300 dark:border-gray-600"
  >
    <span class="bg-none p-2 text-xl">&nbsp;</span>
    <h3 class="items-center text-xl justify-center text-center font-bold">
      {title}
    </h3>
    <button
      class="bg-none text-xl p-2 cursor-pointer hover:bg-gray-400 dark:hover:bg-gray-500 rounded-full transition-colors duration-300 ease-in-out"
      onclick={handleCloseOffcanvas}
      aria-label="Close offcanvas"
    >
      <div class="w-6 h-6 items-center flex justify-center">
        <div class="sr-only">Close</div>
        <Fa icon={faXmark} />
      </div>
    </button>
  </div>
  <div class="grow" style="height: calc(100% - {currentOffcanvasHeight}px);">
    {@render children()}
  </div>
</div>
