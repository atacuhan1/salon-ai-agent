# AGENTS.md

## Pull request merge

Açık PR’larda önce çakışma kontrolü yap. Çakışma varsa düzelt, test et, push et. Çakışma yoksa veya düzeltildiyse **sormadan squash-merge et** (`gh pr merge --squash`). Taslak PR’ı merge etmeden ready yap. Her merge için kullanıcı onayı isteme.

## Backup branch

Her zaman **tek** yedek dal tut: `backup`. Silme, PR olarak merge etme, üzerinde feature geliştirme.

`main`’e squash-merge etmeden hemen önce `origin/main`’i `backup` yap (o anki sağlam hali acil dönüş noktasıdır):

```bash
git fetch origin main
git branch -f backup origin/main
git push -u origin backup --force-with-lease
```

Yeni merge `backup`’ın üstüne yazılmaz; `backup` bir önceki `main` olarak kalır. Bir sonraki merge öncesi tekrar güncellenir. Acil dönüş: `backup`’ı `main`’e al veya o commit’ten hotfix aç.

## Unused branches

GitHub’da `main` ve `backup` dışındaki kullanılmayan dalları sil. `backup` **asla** silinmez, `main` de silinmez.

Kullanılmayan: açık PR’ı yok, `main`/`backup` değil (squash-merge olmuş `cursor/*` iş dalları dahil). Merge sonrası feature dalını da sil (`gh pr merge --squash --delete-branch`).

```bash
git push origin --delete <branch>
```
