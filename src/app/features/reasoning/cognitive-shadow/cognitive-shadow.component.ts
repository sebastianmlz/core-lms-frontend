import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TreeTableModule } from 'primeng/treetable';
import { SkeletonModule } from 'primeng/skeleton';
import { TreeNode } from 'primeng/api';
import { CognitiveGraphResponse } from '../../../entities/reasoning/model/reasoning.types';

/**
 * CognitiveShadowComponent — Pure presentation component.
 * Renders the cognitive shadow graph as a p-treeTable.
 * Converts flat graph (nodes + edges) → TreeNode[] hierarchy internally.
 * Has zero store dependencies; fully reusable in student and tutor contexts.
 */
@Component({
  selector: 'app-cognitive-shadow',
  imports: [TreeTableModule, SkeletonModule],
  templateUrl: './cognitive-shadow.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CognitiveShadowComponent {
  private _graph: CognitiveGraphResponse | null = null;

  @Input() set graph(value: CognitiveGraphResponse | null) {
    this._graph = value;
    this._treeNodes = this.buildTree(value);
  }
  get graph(): CognitiveGraphResponse | null { return this._graph; }

  @Input() isLoading = false;

  _treeNodes: TreeNode[] = [];

  readonly skeletonRows = [1, 2, 3, 4];

  private buildTree(graph: CognitiveGraphResponse | null): TreeNode[] {
    if (!graph) return [];

    const nodeMap = new Map<string, TreeNode>();
    graph.nodes.forEach((n) => {
      nodeMap.set(n.id, {
        data: { id: n.id, name: n.label, cognitive_state: n.cognitive_state },
        expanded: true,
        children: [],
      });
    });

    const childIds = new Set<string>();
    graph.edges.forEach((edge) => {
      const parent = nodeMap.get(edge.target);
      const child = nodeMap.get(edge.source);
      if (parent && child) {
        parent.children = parent.children ?? [];
        parent.children.push(child);
        childIds.add(edge.source);
      }
    });

    const roots: TreeNode[] = [];
    graph.nodes.forEach((n) => {
      if (!childIds.has(n.id)) {
        const root = nodeMap.get(n.id);
        if (root) roots.push(root);
      }
    });

    return roots.length > 0 ? roots : Array.from(nodeMap.values());
  }
}
