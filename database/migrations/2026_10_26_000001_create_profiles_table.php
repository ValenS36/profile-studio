<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
 public function up(): void {
  Schema::create('profiles', function(Blueprint $table) {
   $table->id(); $table->foreignId('user_id')->nullable()->unique()->constrained()->restrictOnDelete();
   $table->json('draft'); $table->json('published')->nullable(); $table->timestamp('published_at')->nullable(); $table->timestamps();
  });
  DB::table('profiles')->insert(['id'=>1,'draft'=>json_encode(\App\Models\Profile::defaults()),'created_at'=>now(),'updated_at'=>now()]);
 }
 public function down(): void { Schema::dropIfExists('profiles'); }
};
