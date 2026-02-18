#!/bin/sh

# Configuration Firewall avec logging pour SOC

echo "=== Configuration Firewall avec logging ==="

# Activer IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# Nettoyer les règles
iptables -F
iptables -t nat -F
iptables -X

# Politique par défaut
iptables -P FORWARD DROP
iptables -P INPUT ACCEPT
iptables -P OUTPUT ACCEPT

# Log des paquets DROP (pour analyse SOC)
iptables -N LOGGING
iptables -A LOGGING -m limit --limit 5/min -j LOG --log-prefix "IPTables-Dropped: " --log-level 4
iptables -A LOGGING -j DROP

# Connexions établies
iptables -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT

# NAT sortant
iptables -t nat -A POSTROUTING -s 10.200.0.0/24 -o eth0 -j MASQUERADE

# Forward interne -> externe
iptables -A FORWARD -i eth1 -o eth0 -s 10.200.0.0/24 -j ACCEPT

# Port forwarding vers serveur avec log
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j DNAT --to-destination 10.200.0.10:80
iptables -A FORWARD -i eth0 -o eth1 -p tcp --dport 80 -d 10.200.0.10 -m state --state NEW -j LOG --log-prefix "HTTP-Access: "
iptables -A FORWARD -i eth0 -o eth1 -p tcp --dport 80 -d 10.200.0.10 -j ACCEPT

# Bloquer le reste avec log
iptables -A FORWARD -i eth0 -o eth1 -j LOGGING

# Sauvegarder les logs dans un fichier
mkdir -p /var/log/firewall
dmesg -T -w | grep -E "IPTables-Dropped|HTTP-Access" >> /var/log/firewall/iptables.log &

echo "=== Firewall configuré ==="
iptables -L -v -n