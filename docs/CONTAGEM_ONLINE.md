# Contagem online de partidas

O jogo envia uma contagem **anônima** para um banco gratuito do Google (Firebase Realtime Database).
O painel fica em **https://edipopr.github.io/JOGO_BEM/painel.html** (exemplo com dados de mentira: `painel.html?demo=1`).

## O que é guardado
- Cada aparelho ganha um código aleatório (sem nome, e-mail, localização ou qualquer dado pessoal).
- `aparelhos/<código>`: primeira e última vez que jogou, celular ou computador, se instalou o app, partidas, vitórias, derrotas, "tentar de novo" e tempo jogado.
- `dias/<data>/<código>`: quantas partidas o aparelho começou naquele dia.
- `partidas/<auto>`: cada partida terminada (herói, vitória/derrota, tempo, pontos, cristais, estrelas).

## Como ligar (uma vez só, ~5 minutos)
1. Entre em https://console.firebase.google.com com sua conta Google e clique em **Criar um projeto**. Nome: `guizinho`. O Google Analytics pode ficar **desligado**.
2. No menu da esquerda: **Criação → Realtime Database → Criar banco de dados**. Local: Estados Unidos. Escolha **Iniciar no modo bloqueado**.
3. Abra a aba **Regras**, apague tudo, cole as regras abaixo e clique em **Publicar**.
4. Na aba **Dados**, copie o endereço que aparece no topo (algo como `https://guizinho-xxxxx-default-rtdb.firebaseio.com`).
5. Cole o endereço em `src/config-online.js` (`URL_BANCO`), rode `sh ferramentas/nova_versao.sh`, faça commit e push — ou mande o endereço para o Claude fazer isso.

### Regras do banco
Qualquer pessoa pode **ler** os números (são anônimos) e o jogo só consegue **somar**: não dá para apagar nem mudar partidas já registradas.

```json
{
  "rules": {
    "aparelhos": {
      ".read": true,
      "$id": {
        ".write": "newData.exists() && $id.length <= 36",
        ".validate": "newData.hasChildren(['primeiraVez', 'plataforma'])"
      }
    },
    "dias": {
      ".read": true,
      "$dia": {
        "$id": {
          ".write": "newData.exists() && $id.length <= 36",
          ".validate": "newData.isNumber()"
        }
      }
    },
    "partidas": {
      ".read": true,
      "$partida": {
        ".write": "!data.exists() && newData.exists()",
        ".validate": "newData.hasChildren(['aparelho', 'resultado', 'data'])"
      }
    }
  }
}
```

## Limites do plano grátis (Spark)
1 GB guardado e 10 GB baixados por mês — dá para muitos milhares de partidas. Cada partida ocupa menos de 1 KB.

## Observações
- Sem internet, o jogo funciona normalmente e simplesmente não conta aquela partida.
- Como o jogo é público, alguém mal-intencionado poderia mandar contagens falsas; para acompanhar se as pessoas estão gostando, isso basta.
- Para zerar a contagem: no console do Firebase, aba **Dados**, apague os nós `aparelhos`, `dias` e `partidas`.
