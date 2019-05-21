defmodule Mattchat.Chat do
  use Ecto.Schema
  import Ecto.Changeset


  schema "messages" do
    field :body, :string
    belongs_to :channel, Mattchat.Channel, foreign_key: :channel_name, references: :name, type: :string
    belongs_to :user, Mattchat.Accounts.User

    timestamps()
  end

  @doc false
  def changeset(chat, attrs) do
    chat
    |> cast(attrs, [:body, :channel_name, :user_id])
    |> validate_required([:body, :channel_name, :user_id])
  end

end
