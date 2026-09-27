import type { ComponentExample, ComponentSnapshot, ComponentSpec, PropertySpec, RestoreItem } from './types';

export const RESTORABLE_FIELDS = [
  'name', 'category', 'status', 'purpose', 'usage',
  'states', 'keyboardBehavior', 'screenReader', 'disabledScenarios'
] as const;

export type RestorableField = (typeof RESTORABLE_FIELDS)[number];

const FIELD_LABELS: Record<RestorableField, string> = {
  name: '组件名称',
  category: '分类',
  status: '状态',
  purpose: '用途',
  usage: '使用规则',
  states: '状态说明',
  keyboardBehavior: '键盘行为',
  screenReader: '读屏说明',
  disabledScenarios: '禁用场景'
};

const formatProperty = (property?: PropertySpec): string =>
  property
    ? `${property.name}（${property.type}${property.required ? '，必填' : ''}，默认 ${property.defaultValue || '空'}）${property.description}`
    : '（当前草稿中不存在）';

const formatExample = (example?: ComponentExample): string =>
  example ? `${example.title}\n${example.code}` : '（当前草稿中不存在）';

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Builds the granular diff between the live draft and a snapshot. Every row is
 * a single field, property or example that can be restored on its own.
 */
export function buildRestoreItems(component: ComponentSpec, snapshot?: ComponentSnapshot): RestoreItem[] {
  if (!snapshot) return [];
  const items: RestoreItem[] = [];
  for (const field of RESTORABLE_FIELDS) {
    const before = String(snapshot.component[field] ?? '');
    const after = String(component[field] ?? '');
    if (before !== after) items.push({ id: `field:${field}`, kind: 'field', label: `字段 · ${FIELD_LABELS[field]}`, before, after });
  }
  for (const property of snapshot.component.properties) {
    const current = component.properties.find((item) => item.id === property.id);
    if (!current || !same(property, current)) {
      items.push({ id: `property:${property.id}`, kind: 'property', label: `属性 · ${property.name}`, before: formatProperty(property), after: formatProperty(current) });
    }
  }
  for (const example of snapshot.component.examples) {
    const current = component.examples.find((item) => item.id === example.id);
    if (!current || !same(example, current)) {
      items.push({ id: `example:${example.id}`, kind: 'example', label: `示例 · ${example.title}`, before: formatExample(example), after: formatExample(current) });
    }
  }
  return items;
}
