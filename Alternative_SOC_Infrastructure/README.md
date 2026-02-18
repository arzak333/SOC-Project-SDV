# Infrastructure Docker LÃ©gÃ¨re pour SOC

## DÃ©marrage rapide (Windows)

```powershell
# Démarrer l'infrastructure
docker-compose up -d

# Configurer le firewall
docker cp firewall-config.sh firewall:/tmp/
docker exec firewall sh /tmp/firewall-config.sh
```

## 

- Serveur web : http://localhost:8080
- Firewall : `docker exec -it firewall sh`
- Server : `docker exec -it server sh`
- PC1 : `docker exec -it pc1 sh`
- PC2 : `docker exec -it pc2 sh`
- PC3 : `docker exec -it pc3 sh`

## Architecture

```
[Attacker] (172.20.0.100) - placeholder
       |
  [Firewall] (172.20.0.10 / 192.168.100.1)
       |
       â”œâ”€â”€ [Server] (192.168.100.10) - Nginx
       â”œâ”€â”€ [PC1] (192.168.100.101) - SSH (root:password123)
       â”œâ”€â”€ [PC2] (192.168.100.102) - SSH (root:admin)
       â””â”€â”€ [PC3] (192.168.100.103) - SSH (root:12345)
```

## Logs

Les logs sont dans `.\logs\` :
- `nginx\access.log` - Accès HTTP
- `nginx\error.log` - Erreurs
- `pc1\auth.log` - SSH PC1
- `pc2\auth.log` - SSH PC2
- `pc3\auth.log` - SSH PC3
- `firewall\iptables.log` - Firewall

## Pipelines vers SOC

3 pipelines disponibles (Ã  configurer selon votre SOC) :
- `filebeat.yml` - Pour Elasticsearch, Kafka
- `fluentd.conf` - Pour Splunk, HTTP
- `logstash.conf` - Parsing avancé

## Arrèt

```powershell
docker-compose down
```
