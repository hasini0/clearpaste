// "What you need to do": a checklist with live countdowns and one-tap
// calendar reminders.

import { h, icon } from '../../core/dom.js';
import { downloadCalendar } from '../../features/calendar.js';
import { daysBetween, formatDate, relativeDays } from '../format.js';
import { card } from './card.js';

function dueChip(action, ctx) {
  const days = daysBetween(ctx.today, action.deadline);
  const tone = days < 0 ? 'is-past' : days <= 3 ? 'is-urgent' : days <= 14 ? 'is-soon' : '';
  return h('span', { class: `due ${tone}` },
    icon('clock'),
    `${formatDate(action.deadline, ctx.lang)} · ${relativeDays(days, ctx.lang)}`,
  );
}

const toEvent = (action, ctx) => ({
  title: action.task,
  date: action.deadline,
  description: `From your ${ctx.result.docType.toLowerCase()} — explained by ClearPaste.\n\n${ctx.result.oneLiner}`,
});

function actionItem(action, index, ctx) {
  const id = `todo-${index}`;
  const item = h('li', { class: `todo-item is-${action.priority}` });
  const checkbox = h('input', {
    class: 'todo-check', type: 'checkbox', id,
    onchange: (e) => item.classList.toggle('is-done', e.target.checked),
  });

  const meta = h('div', { class: 'todo-meta' },
    action.deadline && dueChip(action, ctx),
    action.priority === 'high' && !action.deadline && h('span', { class: 'due is-soon' }, 'Important'),
    action.deadline && h('button', {
      class: 'btn btn-sm', type: 'button', onclick: () => downloadCalendar([toEvent(action, ctx)]),
    }, icon('calendar-plus'), 'Add reminder'),
  );

  item.append(checkbox, h('div', {}, h('label', { class: 'todo-task', for: id, 'data-speak': '' }, action.task), meta.childNodes.length ? meta : null));
  return item;
}

export function actionsCard(result, ctx) {
  const dated = result.actions.filter((a) => a.deadline);
  const addAll = dated.length > 1
    ? h('button', { class: 'btn btn-sm', type: 'button', onclick: () => downloadCalendar(dated.map((a) => toEvent(a, ctx))) },
        icon('calendar'), 'Add all to calendar')
    : null;

  const body = result.actions.length
    ? h('ol', { class: 'todo' }, result.actions.map((a, i) => actionItem(a, i, ctx)))
    : h('p', { class: 'card-empty', 'data-speak': '' }, 'Good news: this document does not ask you to do anything.');

  return card(
    { title: result.redFlags.level === 'danger' ? 'What to do to stay safe' : 'What you need to do', iconName: 'list', ctx, actions: [addAll] },
    body,
    result.ifIgnored && h('div', { class: 'consequence' },
      h('strong', {}, result.redFlags.level === 'danger' ? 'If you ignore it' : 'If you do nothing'),
      h('p', { 'data-speak': '' }, result.ifIgnored),
    ),
  );
}
