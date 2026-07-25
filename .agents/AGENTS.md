# Conversation Logging Rule
At the end of every task or conversation turn, you MUST run the following command to append the latest prompts and responses to `prompt.md`:

```bash
export PATH=$PATH:/usr/local/bin:/opt/homebrew/bin:~/.nvm/versions/node/v20*/bin; node scripts/update_prompt_md.js
```

Do this proactively without asking for permission.
