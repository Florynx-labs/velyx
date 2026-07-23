import { signal } from '@velyx/core';
import { createElement, mount } from '@velyx/runtime-dom';

function TodoApp() {
  const todos = signal([
    { id: 1, text: 'Master VELYX Signal Reactivity', completed: true },
    { id: 2, text: 'Build Compiler-First Application', completed: false }
  ]);
  const newText = signal('');

  function addTodo() {
    if (!newText().trim()) return;
    todos([...todos(), { id: Date.now(), text: newText(), completed: false }]);
    newText('');
  }

  return createElement('div', { style: 'max-width: 450px; margin: 4rem auto; padding: 2rem; background: #12161f; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);' },
    createElement('h1', { style: 'font-size: 1.6rem; margin-bottom: 1rem; color: #38bdf8;' }, 'VELYX Todo List'),
    createElement('p', { style: 'color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;' }, () => `Remaining tasks: ${todos().filter(t => !t.completed).length}`),
    createElement('div', { style: 'display: flex; gap: 0.5rem; margin-bottom: 1.5rem;' },
      createElement('input', {
        style: 'flex: 1; background: #090c13; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 0.6rem 1rem; border-radius: 6px;',
        placeholder: 'What needs to be done?',
        'vx-model': newText
      }),
      createElement('button', {
        style: 'background: #6366f1; color: #fff; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 700; cursor: pointer;',
        'vx-on:click': addTodo
      }, 'Add')
    ),
    createElement('ul', { style: 'list-style: none; padding: 0;' },
      () => todos().map(item =>
        createElement('li', {
          style: `padding: 0.8rem; margin-bottom: 0.5rem; background: #1a202c; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; ${item.completed ? 'opacity: 0.5; text-decoration: line-through;' : ''}`
        },
          createElement('span', null, item.text),
          createElement('button', {
            style: 'background: #ef4444; border: none; color: #fff; padding: 0.2rem 0.6rem; border-radius: 4px; cursor: pointer;',
            'vx-on:click': () => todos(todos().filter(t => t.id !== item.id))
          }, '×')
        )
      )
    )
  );
}

mount(TodoApp, '#app');
