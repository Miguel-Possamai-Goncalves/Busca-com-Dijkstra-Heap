class Graph {
  constructor() {
    this.adjList = {};
    this.tolls = {};
  }

  addVertex(city, toll) {
    if (!this.adjList[city]) {
      this.adjList[city] = [];
      this.tolls[city] = toll;
    }
  }

  addEdge(u, v, distance) {
    this.adjList[u].push({ node: v, distance });
    this.adjList[v].push({ node: u, distance });
  }
}

class MinHeap {
  constructor() {
    this.heap = [];
  }

  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  push(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  bubbleUp(idx) {
    const parent = Math.floor((idx - 1) / 2);
    if (parent >= 0 && this.heap[parent].cost > this.heap[idx].cost) {
      this.swap(parent, idx);
      this.bubbleUp(parent);
    }
  }

  pop() {
    if (!this.heap.length) return null;
    this.swap(0, this.heap.length - 1);
    const top = this.heap.pop();
    this.bubbleDown(0);
    return top;
  }

  bubbleDown(idx) {
    const left = 2 * idx + 1;
    const right = 2 * idx + 2;
    let smallest = idx;

    if (left < this.heap.length && this.heap[left].cost < this.heap[smallest].cost) {
      smallest = left;
    }
    if (right < this.heap.length && this.heap[right].cost < this.heap[smallest].cost) {
      smallest = right;
    }
    if (smallest !== idx) {
      this.swap(idx, smallest);
      this.bubbleDown(smallest);
    }
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

function loadGraph() {
  fetch('/json/capitais.json')
    .then(res => res.json())
    .then(data => {
      window.graph = new Graph();
      
      data.forEach(entry => {
        const [city, info] = Object.entries(entry)[0];
        graph.addVertex(city, info.toll);
      });
      
      data.forEach(entry => {
        const [city, info] = Object.entries(entry)[0];
        Object.entries(info.neighbors).forEach(([nbr, dist]) => {
          graph.addEdge(city, nbr, dist);
        });
      });
      populateSelects();
    })
    .catch(err => console.error('Erro ao carregar capitais.json:', err));
}

function populateSelects() {
  const origem = document.getElementById('origem');
  const destino = document.getElementById('destino');
  Object.keys(graph.adjList).sort().forEach(city => {
    origem.add(new Option(city, city));
    destino.add(new Option(city, city));
  });
}

function dijkstra(start, end, fuelPrice, autonomy) {
  const costs = {}, prev = {};
  const heap = new MinHeap();

  Object.keys(graph.adjList).forEach(c => costs[c] = Infinity);
  costs[start] = 0;
  heap.push({ city: start, cost: 0 });

  while (!heap.isEmpty()) {
    const { city: u, cost } = heap.pop();
    if (u === end) break;

    graph.adjList[u].forEach(({ node: v, distance }) => {
      const fuelCost = (distance / autonomy) * fuelPrice;
      
      const tollCost = (v === end) ? 0 : (graph.tolls[v] || 0);
      const newCost = cost + fuelCost + tollCost;
      if (newCost < costs[v]) {
        costs[v] = newCost;
        prev[v] = u;
        heap.push({ city: v, cost: newCost });
      }
    });
  }

  if (costs[end] === Infinity) return null;
  const path = [];
  for (let cur = end; cur; cur = prev[cur]) path.unshift(cur);
  return { path, cost: costs[end] };
}

document.addEventListener('DOMContentLoaded', () => {
  loadGraph();
  document.getElementById('buscar').addEventListener('click', () => {
    const o = document.getElementById('origem').value;
    const d = document.getElementById('destino').value;
    const p = parseFloat(document.getElementById('combustivel').value);
    const a = parseFloat(document.getElementById('autonomia').value);
    if (!o || !d || isNaN(p) || isNaN(a)) {
      alert('Preencha todos os campos!');
      return;
    }
    const result = dijkstra(o, d, p, a);
    document.getElementById('caminho').textContent = result ? result.path.join(' → ') : 'Rota inexistente';
    document.getElementById('custo').textContent = result ? result.cost.toFixed(2) : '0.00';
  });
  document.getElementById('limpar').addEventListener('click', () => {
    document.getElementById('caminho').textContent = '---';
    document.getElementById('custo').textContent = '0.00';
  });
});
