using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);

// ✅ Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowAll");

string connStr = builder.Configuration.GetConnectionString("DefaultConnection");


// 🟢 HEALTH
app.MapGet("/health", () =>
{
    return Results.Json(new { status = "OK", service = ".NET" });
});


// 🔵 GET USERS
app.MapGet("/users", () =>
{
    try
    {
        var users = new List<object>();

        using var conn = new MySqlConnection(connStr);
        conn.Open();

        var cmd = new MySqlCommand("SELECT * FROM users", conn);
        var reader = cmd.ExecuteReader();

        while (reader.Read())
        {
            users.Add(new
            {
                id = reader.GetInt32("id"),
                name = reader.GetString("name")
            });
        }

        return Results.Json(users);
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
});


// 🟡 ADD USER (FIXED)
app.MapPost("/users", async (HttpRequest request) =>
{
    try
    {
        var data = await request.ReadFromJsonAsync<Dictionary<string, string>>();

        if (data == null || !data.ContainsKey("name") || string.IsNullOrWhiteSpace(data["name"]))
        {
            return Results.BadRequest(new { error = "Name is required" });
        }

        string name = data["name"];

        using var conn = new MySqlConnection(connStr);
        conn.Open();

        var cmd = new MySqlCommand("INSERT INTO users (name) VALUES (@name)", conn);
        cmd.Parameters.AddWithValue("@name", name);
        cmd.ExecuteNonQuery();

        return Results.Json(new { message = "User added" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
});


// 🔴 DELETE USER
app.MapDelete("/users/{id}", (int id) =>
{
    try
    {
        using var conn = new MySqlConnection(connStr);
        conn.Open();

        var cmd = new MySqlCommand("DELETE FROM users WHERE id = @id", conn);
        cmd.Parameters.AddWithValue("@id", id);
        cmd.ExecuteNonQuery();

        return Results.Json(new { message = "Deleted" });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = ex.Message }, statusCode: 500);
    }
});


// 🚀 RUN (IMPORTANT)
app.Run("http://0.0.0.0:8004");