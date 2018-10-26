# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :mattchat,
  ecto_repos: [Mattchat.Repo]

# Configures the endpoint
config :mattchat, MattchatWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "mimidAsidRZ6bKPNv/ZqqughRjkga79Vj2nTxdsq/F9jaJtTiVgq9xI0fX3DfxLW",
  render_errors: [view: MattchatWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Mattchat.PubSub,
           adapter: Phoenix.PubSub.PG2]


# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:user_id]

# Configures Guardian's Token Signing
config :mattchat, Mattchat.Accounts.Guardian,
  issuer: "mattchat",
  secret_key: "wUlUb3WQA2M/g2HZeloWttPS2olDcOv9QYv7DpiReesKY9LC9FWYF90OwWZPGwZR"

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
