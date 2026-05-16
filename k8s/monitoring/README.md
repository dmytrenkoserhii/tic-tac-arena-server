# Tic Tac Arena Monitoring

This folder connects Tic Tac Arena to the existing cluster monitoring stack in the `monitoring` namespace.

It does not install a second Prometheus, Grafana, Loki, or Promtail stack.

## Apply

```powershell
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml apply -f k8s\monitoring\prometheus-config.yaml
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml apply -f k8s\monitoring\promtail-config.yaml
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml apply -f k8s\monitoring\tic-tac-arena-grafana-dashboards.yaml
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml apply -f k8s\monitoring\grafana-deployment.yaml
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout restart deployment/prometheus -n monitoring
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout restart daemonset/promtail -n monitoring
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout restart deployment/grafana -n monitoring
```

## Verify

```powershell
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout status deployment/prometheus -n monitoring
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout status daemonset/promtail -n monitoring
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout status deployment/grafana -n monitoring
```

Grafana dashboard:

```text
Tic Tac Arena Backend Overview
```
