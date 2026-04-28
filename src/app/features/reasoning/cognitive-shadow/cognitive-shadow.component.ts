import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';
import { CognitiveGraphResponse } from '../../../entities/reasoning/model/reasoning.types';

/**
 * CognitiveShadowComponent — renders the cognitive shadow graph as a
 * directed graph using Cytoscape.js. Nodes are colored by status
 * (failed = red, learning = amber, mastered = green) and edges show
 * the prerequisite relations from the Go reasoning service.
 */
@Component({
  selector: 'app-cognitive-shadow',
  imports: [CommonModule, SkeletonModule],
  templateUrl: './cognitive-shadow.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CognitiveShadowComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() graph: CognitiveGraphResponse | null = null;
  @Input() isLoading = false;

  @ViewChild('cyHost', { static: false })
  cyHost?: ElementRef<HTMLDivElement>;

  private cy: Core | null = null;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['graph'] && this.viewReady) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.cy?.destroy();
    this.cy = null;
  }

  private render(): void {
    if (!this.cyHost || !this.graph) {
      return;
    }
    const elements: ElementDefinition[] = [
      ...this.graph.nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          status: n.cognitive_state,
        },
      })),
      ...this.graph.edges.map((e, idx) => ({
        data: {
          id: `e${idx}-${e.source}->${e.target}`,
          source: e.source,
          target: e.target,
          relation: e.relation,
        },
      })),
    ];

    if (this.cy) {
      this.cy.destroy();
    }

    this.cy = cytoscape({
      container: this.cyHost.nativeElement,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            color: '#fff',
            'font-size': '11px',
            'font-weight': 'bold',
            width: 78,
            height: 78,
            'text-wrap': 'wrap',
            'text-max-width': '70px',
            'border-width': 2,
            'border-color': '#fff',
          },
        },
        {
          selector: 'node[status = "failed"]',
          style: { 'background-color': '#dc2626' }, // rose-600
        },
        {
          selector: 'node[status = "learning"]',
          style: { 'background-color': '#f59e0b' }, // amber-500
        },
        {
          selector: 'node[status = "mastered"]',
          style: { 'background-color': '#10b981' }, // emerald-500
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: { name: 'breadthfirst', directed: true, padding: 16 },
    });
  }
}
