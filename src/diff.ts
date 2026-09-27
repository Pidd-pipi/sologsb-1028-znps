import type {
  ComponentExample,
  ComponentSnapshot,
  ComponentSpec,
  PropertySpec,
  RestorableField
} from './types';

export const restorableFields: Array<{ key: RestorableField; label: string }> = [
  { key: 'name', label: '组件名称' },
  { key: 'category', label: '分类' },
  { key: 'status', label: '状态' },
  { key: 'purpose', label: '用途' },
  { key: 'usage', label: '使用规则' },
  { key: 'states', label: '状态说明' },
  { key: 'keyboardBehavior', label: '键盘行为' },
  { key: 'screenReader', label: '读屏说明' },
  { key: 'disabledScenarios', label: '禁用场景' },
  { key: 'interactionSignature', label: '交互签名' }
];

export interface FieldDiffEntry {
  kind: 'field';
  key: RestorableField;
  label: string;
  before: string;
  after: string;
}

export interface PropertyDiffEntry {
  kind: 'property';
  id: string;
  name: string;
  /** missing：当前稿已没有该属性；changed：当前稿仍有但内容不同 */
  change: 'missing' | 'changed';
  before: PropertySpec;
  after?: PropertySpec;
}

export interface ExampleDiffEntry {
  kind: 'example';
  id: string;
  title: string;
  change: 'missing' | 'changed';
  before: ComponentExample;
  after?: ComponentExample;
  /** 示例引用、但当前稿已不存在的属性 */
  missingDependencies: Array<{ id: string; name: string }>;
}

export interface SnapshotDiff {
  fields: FieldDiffEntry[];
  properties: PropertyDiffEntry[];
  examples: ExampleDiffEntry[];
  empty: boolean;
}

const exampleContent = (example: ComponentExample) =>
  JSON.stringify({
    title: example.title,
    code: example.code,
    propertyIds: [...example.propertyIds].sort()
  });

export function diffSnapshotEntries(component: ComponentSpec, snapshot?: ComponentSnapshot): SnapshotDiff {
  const diff: SnapshotDiff = { fields: [], properties: [], examples: [], empty: false };
  if (!snapshot) {
    diff.empty = true;
    return diff;
  }
  const source = snapshot.component;

  for (const { key, label } of restorableFields) {
    const before = String(source[key] ?? '');
    const after = String(component[key] ?? '');
    if (before !== after) diff.fields.push({ kind: 'field', key, label, before, after });
  }

  for (const property of source.properties) {
    const current = component.properties.find((item) => item.id === property.id);
    if (!current) {
      diff.properties.push({ kind: 'property', id: property.id, name: property.name, change: 'missing', before: property });
    } else if (JSON.stringify(current) !== JSON.stringify(property)) {
      diff.properties.push({ kind: 'property', id: property.id, name: property.name, change: 'changed', before: property, after: current });
    }
  }

  const currentPropertyIds = new Set(component.properties.map((item) => item.id));
  for (const example of source.examples) {
    const current = component.examples.find((item) => item.id === example.id);
    const differs = !current || exampleContent(current) !== exampleContent(example);
    if (!differs) continue;
    const missingDependencies = example.propertyIds
      .filter((id) => !currentPropertyIds.has(id))
      .map((id) => ({ id, name: source.properties.find((item) => item.id === id)?.name ?? id }));
    diff.examples.push({
      kind: 'example',
      id: example.id,
      title: example.title,
      change: current ? 'changed' : 'missing',
      before: example,
      after: current,
      missingDependencies
    });
  }

  diff.empty = !diff.fields.length && !diff.properties.length && !diff.examples.length;
  return diff;
}
