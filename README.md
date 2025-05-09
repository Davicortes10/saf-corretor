# SAG Corretor

Sistema web responsivo para correção de provas em duas etapas e gerenciamento de usuários, com foco em dispositivos móveis.

## Características

- **Design Mobile-First**: Totalmente responsivo para uso em smartphones, tablets e desktops
- **Autenticação de Usuários**: Sistema de login com diferentes perfis
- **Correção em Duas Etapas**: Processo estruturado para leitura de QR Codes do aluno e do gabarito
- **Gerenciamento de Usuários**: Interface administrativa para cadastro de usuários (apenas para admin)

## Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **Tailwind CSS**: Framework CSS utilitário para estilização
- **JavaScript**: Lógica do lado do cliente

## Acesso ao Sistema

Para fins de demonstração, o sistema inclui um usuário administrador padrão:

- **Login**: admin
- **Senha**: 123456

## Estrutura do Projeto

```
SAG_Corretor/
├── index.html     # Página principal
├── js/
│   └── app.js     # Lógica da aplicação
└── README.md      # Documentação
```

## Funcionalidades

### 1. Tela de Login

- Autenticação com usuário e senha
- Redirecionamento para área restrita após autenticação

### 2. Correção de Provas em Duas Etapas

- **Etapa 1**: Escaneamento do QR Code do aluno
  - Captura dos dados do aluno (nome, escola, turma, matrícula)
  - Exibição das informações capturadas para confirmação

- **Etapa 2**: Escaneamento do QR Code do gabarito
  - Captura das respostas marcadas pelo aluno no gabarito
  - Finalização da correção após as duas etapas

- Histórico das correções realizadas em tabela
- Feedback visual e sonoro durante o processo de escaneamento
- Opção para reiniciar o processo em qualquer etapa

### 3. Gerenciamento de Usuários (apenas para administrador)

- Cadastro de novos usuários com diferentes perfis (Administrador, Professor, Corretor)
- Interface de listagem com opções para editar e excluir usuários
- Validações para manter pelo menos um administrador no sistema

### 4. Interface Personalizada

- Avatar com as iniciais do usuário logado no cabeçalho
- Menu lateral adaptativo para diferentes tamanhos de tela
- Navegação intuitiva entre as páginas

## Formato dos QR Codes

O sistema está preparado para processar QR Codes no seguinte formato:

1. **QR Code do Aluno**: JSON contendo informações do aluno
   ```json
   {
     "nome": "Nome do Aluno",
     "escola": "Nome da Escola",
     "turma": "Turma/Série",
     "matricula": "Número de Matrícula"
   }
   ```

2. **QR Code do Gabarito**: JSON contendo as respostas marcadas
   ```json
   {
     "prova": "Identificação da Prova",
     "respostas": {
       "1": "A",
       "2": "B",
       "3": "C",
       ...
     }
   }
   ```

## Próximos Passos

Este sistema é uma demonstração front-end. Para um ambiente de produção, seria necessário:

1. Implementar backend para persistência de dados
2. Integração com API real para leitura de QR Codes
3. Reforçar mecanismos de segurança e autenticação
4. Implementar geração de relatórios de correção

## Como Iniciar

Basta abrir o arquivo `index.html` em um navegador moderno.

Para funcionalidades de câmera, utilize um servidor local ou um dispositivo móvel com HTTPS configurado corretamente (requisito de segurança dos navegadores para acesso à câmera).

---

Desenvolvido como demonstração para o SAG Corretor. 