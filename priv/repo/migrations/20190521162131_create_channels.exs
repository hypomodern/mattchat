defmodule Mattchat.Repo.Migrations.CreateChannels do
  use Ecto.Migration

  def change do
    create table(:channels, primary_key: false) do
      add :name, :string, primary_key: true

      timestamps()
    end

    alter table(:messages) do
      remove :channel

      add :channel_name, references(:channels, on_delete: :delete_all, column: :name, type: :string), null: false, default: "global"
    end
  end
end
