import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import cytoscape, { Core, ElementDefinition } from 'cytoscape';
import {
  CognitiveGraphEdge,
  CognitiveGraphNode,
} from '../../../entities/reasoning/model/reasoning.types';

@Component({
  selector: 'app-cognitive-shadow',
  templateUrl: './cognitive-shadow.component.html',
  styleUrl: './cognitive-shadow.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CognitiveShadowComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() nodes: CognitiveGraphNode[] = [];
  @Input() edges: CognitiveGraphEdge[] = [];

  @ViewChild('graphHost', { static: true })
  graphHost!: ElementRef<HTMLDivElement>;

  private graph: Core | null = null;

  ngAfterViewInit(): void {
    this.renderGraph();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.graphHost || (!changes['nodes'] && !changes['edges'])) {
      return;
    }

    this.renderGraph();
  }

  ngOnDestroy(): void {
    this.graph?.destroy();
  }

  private renderGraph(): void {
    if (!this.graphHost) {
      return;
    }

    const elements: ElementDefinition[] = [
      ...this.nodes.map((node) => ({
        data: {
          id: node.id,
          label: node.label,
          status: node.status,
        },
      })),
      ...this.edges.map((edge) => ({
        data: {
          source: edge.source,
          target: edge.target,
          relation: edge.relation,
        },
      })),
    ];

    this.graph?.destroy();

    if (!elements.length) {
      this.graph = null;
      return;
    }

    this.graph = cytoscape({
      container: this.graphHost.nativeElement,
      elements,
      layout: {
        name: 'cose',
        animate: false,
      },
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            color: '#0f172a',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '10px',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'background-color': '#94a3b8',
            'border-color': '#1e293b',
            'border-width': 1,
            width: 44,
            height: 44,
          },
        },
        {
          selector: 'node[status = "failed"]',
          style: {
            'background-color': '#ef4444',
            'border-color': '#991b1b',
          },
        },
        {
          selector: 'node[status = "learning"]',
          style: {
            'background-color': '#eab308',
            'border-color': '#854d0e',
          },
        },
        {
          selector: 'node[status = "mastered"]',
          style: {
            'background-color': '#22c55e',
            'border-color': '#166534',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#64748b',
            'target-arrow-color': '#64748b',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(relation)',
            'font-size': '9px',
            color: '#334155',
          },
        },
      ],
    });

    this.graph.fit(undefined, 20);
  }
}
