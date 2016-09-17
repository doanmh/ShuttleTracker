#include <pebble.h>

static Window *s_main_window;
static TextLayer *s_shuttle_layer;
static GFont s_shuttle_font;

static void main_window_load(Window *window) {
	Layer *window_layer = window_get_root_layer(window);
	GRect bounds = layer_get_bounds(window_layer);
	
	s_shuttle_layer = text_layer_create(GRect(0, PBL_IF_ROUND_ELSE(90, 85), bounds.size.w, 25));

	text_layer_set_background_color(s_shuttle_layer, GColorClear);
	text_layer_set_text_color(s_shuttle_layer, GColorBlack);
	text_layer_set_text_alignment(s_shuttle_layer, GTextAlignmentLeft);
	text_layer_set_text(s_shuttle_layer, "Loading.... ");

	s_shuttle_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_PERFECT_DOS_15));
	text_layer_set_font(s_shuttle_layer, s_shuttle_font);

	layer_add_child(window_get_root_layer(window), text_layer_get_layer(s_shuttle_layer));
}

static void main_window_unload(Window *window) {
	text_layer_destroy(s_shuttle_layer);
	fonts_unload_custom_font(s_shuttle_font);
}

static void inbox_received_callback(DictionaryIterator *iterator, void *context) {
	static char arrival_buffer[8];
	static char shuttle_layer_buffer[32];

	Tuple *arrival_tuple = dict_find(iterator, MESSAGE_KEY_ARRIVALTIME);

	if (arrival_tuple) {
		snprintf(arrival_buffer, sizeof(arrival_buffer), "%d mins", (int)arrival_tuple->value->int32);
	}
	snprintf(shuttle_layer_buffer, sizeof(shuttle_layer_buffer), "%s", arrival_buffer);
	text_layer_set_text(s_shuttle_layer, shuttle_layer_buffer);
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Message droppped!");
}

static void outbox_failed_callback(DictionaryIterator *iterator, AppMessageResult reason, void *context){
  APP_LOG(APP_LOG_LEVEL_ERROR, "Outbox sent failed!");
}

static void outbox_sent_callback(DictionaryIterator *iterator, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "Outbox sent success!");
}

static void init() {
	s_main_window = window_create();

	window_set_window_handlers(s_main_window, (WindowHandlers) {
		.load = main_window_load,
		.unload = main_window_unload
	});

	window_stack_push(s_main_window, true);

	app_message_register_inbox_received(inbox_received_callback);
	app_message_register_inbox_dropped(inbox_dropped_callback);
	app_message_register_outbox_failed(outbox_failed_callback);
	app_message_register_outbox_sent(outbox_sent_callback);

	const int inbox_size = 128;
	const int outbox_size = 128;
	app_message_open(inbox_size, outbox_size);
}

static void deinit() {
	window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
