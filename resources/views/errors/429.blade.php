@extends('errors::minimal')

@section('title', __('Too many requests'))
@section('code', '429')
@section('message', __('Too many requests. Please wait a few minutes before trying again.'))
