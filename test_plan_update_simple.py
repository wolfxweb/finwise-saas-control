#!/usr/bin/env python3
"""
Script simples para testar a atualização de planos
"""

import urllib.request
import json

# Dados para atualizar o plano Empresarial (apenas adicionando o módulo accounts)
plan_data = {
    'modules': [
        'cash_flow',
        'accounts_receivable', 
        'accounts_payable',
        'cost_center',
        'products',
        'inventory',
        'suppliers',
        'purchases',
        'shipping',
        'orders',
        'marketplace',
        'invoice',
        'users',
        'support',
        'accounts'  # Módulo de contas
    ]
}

# Preparar a requisição
data = json.dumps(plan_data).encode('utf-8')
req = urllib.request.Request(
    'http://localhost:8000/api/v1/admin/plans/e3a02327-e6cf-4c0e-bef7-b34335a290f1',
    data=data,
    headers={'Content-Type': 'application/json'},
    method='PUT'
)

try:
    # Fazer a requisição
    with urllib.request.urlopen(req) as response:
        result = response.read().decode('utf-8')
        print('Status:', response.status)
        print('Resposta:', result)
except Exception as e:
    print('Erro:', e) 